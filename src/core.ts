import { CacheObject, StorageOptions } from './types'
import { CacheRecord } from './record'
import { CacheWrapper } from './wrapper'
import { DEFAULTS } from './constants'
import { ValueError } from './errors'
import { driverWithDefaultSerialization } from '@aveq-research/localforage-asyncstorage-driver'
import localforage from 'localforage'
import semVer from 'compare-versions'

/*
    The functions exported from this file use a shared state object that is encapsulated in the file namespace.
    
    This is required in order to allow sharing of cache wrappers outside of the react component tree. I.e. 
    when cache init occurs as part of a provider or a useEffect block inside a top level React component, 
    we need a way to share the cache instances created within the component, with logic outside of it,
    such as in Redux actions. 
*/

const state: {
    wrappers: Record<string, CacheWrapper>
    init: boolean
    rnDriverDefined: boolean
    namespace: string
} = {
    init: false,
    namespace: DEFAULTS.NAME,
    rnDriverDefined: false,
    wrappers: {},
}
const retrieveAndPruneRecords = async (
    allowStale: boolean,
    instance: LocalForage,
    version: string,
): Promise<CacheRecord[]> => {
    const keys = await instance.keys()
    const promises = keys.map(
        async (key) => await instance.getItem<CacheObject>(key),
    )
    const retrievedItems = await Promise.all(promises)
    const cacheObjects = retrievedItems.filter(
        (item) => item !== null && typeof item === 'object',
    ) as CacheObject[]
    const records = cacheObjects.map(
        (item) =>
            new CacheRecord(
                item.key,
                item.version,
                item.value,
                item.expiration,
            ),
    )
    const invalidRecordKeys = records
        .filter(
            (record) =>
                semVer.compare(record.version, version, '<') ||
                (!allowStale && record.isStale()),
        )
        .map((record) => record.key)
    await Promise.all(
        invalidRecordKeys.map(async (key) => await instance.removeItem(key)),
    )
    return records.filter((record) => !invalidRecordKeys.includes(record.key))
}

export async function createCacheInstance({
    namespace,
    version = DEFAULTS.VERSION,
    storeName = DEFAULTS.STORE_NAME,
    allowStale = DEFAULTS.ALLOW_STALE,
    preferCache = DEFAULTS.PREFER_CACHE,
    ...rest
}: StorageOptions = {}): Promise<CacheWrapper> {
    state.namespace = !state.init && namespace ? namespace : state.namespace
    const config: LocalForageOptions = {
        name: state.namespace,
        ...rest,
    }
    if (!state.init) {
        localforage.config()
        await localforage.ready()
        state.init = true
    }
    if (navigator.product === 'ReactNative') {
        const AsyncStorageDriver = driverWithDefaultSerialization()
        config.driver = AsyncStorageDriver._driver
        if (!state.rnDriverDefined) {
            await localforage.defineDriver(AsyncStorageDriver)
            await localforage.setDriver(config.driver)
            state.rnDriverDefined = true
        }
    }

    if (!state.wrappers[storeName]) {
        const instance = localforage.createInstance({
            storeName,
            ...config,
        })
        const validRecords = await retrieveAndPruneRecords(
            allowStale,
            instance,
            version,
        )
        const cache = new Map(
            validRecords.map((record) => [record.key, record]),
        )
        state.wrappers[storeName] = new CacheWrapper({
            allowStale,
            cache,
            instance,
            storeName,
            preferCache,
            version,
        })
    }
    return state.wrappers[storeName]
}

export async function dropCacheInstance(
    storeName = DEFAULTS.STORE_NAME,
): Promise<void> {
    if (!Reflect.has(state.wrappers, storeName)) {
        throw new ValueError(`invalid storeName ${storeName}`)
    }
    const wrapper = state.wrappers[storeName]
    await wrapper.instance.dropInstance({ name: state.namespace, storeName })
    delete state.wrappers[storeName]
}

export async function cacheFactory(
    configs?: StorageOptions | StorageOptions[],
): Promise<typeof state.wrappers> {
    if (!configs) {
        await createCacheInstance()
    } else {
        const promises = (Array.isArray(configs) ? configs : [configs]).map(
            async (options) => {
                await createCacheInstance(options)
            },
        )
        await Promise.all(promises)
    }
    return state['wrappers']
}

export function getStorage(
    storeName: string = DEFAULTS.STORE_NAME,
): CacheWrapper {
    if (!Reflect.has(state.wrappers, storeName)) {
        throw new ValueError(`invalid storeName ${storeName}`)
    }
    return state.wrappers[storeName]
}
