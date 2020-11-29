import { CacheObject, CacheOptions, CacheProviderProps } from './types'
import { CacheRecord } from './record'
import { CacheWrapper } from './wrapper'
import { driverWithDefaultSerialization } from '@aveq-research/localforage-asyncstorage-driver'
import React, { createContext, useEffect, useState } from 'react'
import localforage from 'localforage'
import semVer from 'compare-versions'

// convenience exports
export * from './types'
export { CacheRecord }

export const DEFAULTS = {
    NAME: 'RCache',
    STORE_NAME: 'defaultCache',
    VERSION: '1.0.0',
    ALLOW_STALE: false,
    PREFER_CACHE: true,
}

const state: {
    wrappers: Record<string, Record<string, CacheWrapper>>
    init: boolean
    rnDriverDefined: boolean
} = { wrappers: {}, init: false, rnDriverDefined: false }

export const CacheContext = createContext<
    Record<string, Record<string, CacheWrapper>>
>({})

export default function CacheProvider({
    onReady,
    children,
    options,
}: CacheProviderProps): React.ReactElement {
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        ;(async () => {
            if (
                !options ||
                (typeof options === 'object' && !Array.isArray(options))
            ) {
                await createCacheInstance(options)
            } else {
                await Promise.all(
                    options.map(async (o) => await createCacheInstance(o)),
                )
            }
            setIsLoaded(true)
        })()
    }, [])

    useEffect(() => {
        if (isLoaded && onReady) {
            onReady()
        }
    }, [isLoaded])

    return (
        <CacheContext.Provider value={state.wrappers}>
            {children}
        </CacheContext.Provider>
    )
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
    name = DEFAULTS.NAME,
    version = DEFAULTS.VERSION,
    storeName = DEFAULTS.STORE_NAME,
    allowStale = DEFAULTS.ALLOW_STALE,
    preferCache = DEFAULTS.PREFER_CACHE,
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
    name = DEFAULTS.NAME,
    storeName = DEFAULTS.STORE_NAME,
}: { name?: string; storeName?: string } = {}): Promise<void> {
    if (!state.wrappers[name]?.[storeName]) {
        throw new Error('')
    }
    const wrapper = state.wrappers[name][storeName]
    await wrapper.instance.dropInstance({ name, storeName })
    delete state.wrappers[name][storeName]
}
