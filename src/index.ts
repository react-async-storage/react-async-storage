import { CacheObject, CacheOptions } from './types'
import { CacheRecord } from './record'
import { CacheWrapper } from './wrapper'
import { driverWithDefaultSerialization } from '@aveq-research/localforage-asyncstorage-driver'
import localforage from 'localforage'
import semVer from 'compare-versions'

// convenience exports
export * from './types'
export { CacheRecord }

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

export default async function CacheFactory({
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

    localforage.config()
    await localforage.ready()

    if (navigator.product === 'ReactNative') {
        const AsyncStorageDriver = driverWithDefaultSerialization()
        config.driver = AsyncStorageDriver._driver
        await localforage.defineDriver(AsyncStorageDriver)
        await localforage.setDriver(config.driver)
    }

    const instance = localforage.createInstance({
        storeName,
        ...config,
    })
    const validRecords = await retrieveAndPruneRecords(
        allowStale,
        instance,
        version,
    )
    const cache = new Map(validRecords.map((record) => [record.key, record]))
    const wrapper = new CacheWrapper({
        allowStale,
        cache,
        instance,
        name,
        preferCache,
        version,
    })
    return wrapper
}
