import { CacheObject, CacheOptions } from './types'
import { CacheRecord } from './record'
import { CacheWrapper } from './wrapper'
import { driverWithDefaultSerialization } from '@aveq-research/localforage-asyncstorage-driver'
import localforage from 'localforage'
import semVer from 'compare-versions'

// convenience exports
export * from './types'
export { CacheRecord }

const state: {
    wrappers: Record<string, Record<string, CacheWrapper>>
    init: boolean
    rnDriverDefined: boolean
} = { wrappers: {}, init: false, rnDriverDefined: false }

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
    name = 'RCache',
    version = '1.0.0',
    storeName = 'defaultCache',
    allowStale = false,
    preferCache = true,
    ...rest
}: CacheOptions = {}): Promise<CacheWrapper> {
    const config: LocalForageOptions = {
        name,
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

    if (!state.wrappers[name]) {
        state.wrappers[name] = {}
    }
    if (!state.wrappers[name][storeName]) {
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
        state.wrappers[name][storeName] = new CacheWrapper({
            allowStale,
            cache,
            instance,
            name,
            preferCache,
            version,
        })
    }
    return state.wrappers[name][storeName]
}

export async function dropCacheInstance({
    name = 'RCache',
    storeName = 'defaultCache',
}: { name?: string; storeName?: string } = {}): Promise<void> {
    if (!state.wrappers[name]?.[storeName]) {
        throw new Error('')
    }
    let wrapper: CacheWrapper | null = state.wrappers[name][storeName]
    await wrapper.instance.dropInstance({ name, storeName })
    delete state.wrappers[name][storeName]
    wrapper = null
}
