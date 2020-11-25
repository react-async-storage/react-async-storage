import { CacheOptions } from './types'
import { CacheRecord } from './record'
import { CacheWrapper } from './wrapper'
import { VersionError } from './errors'
import { driverWithDefaultSerialization } from '@aveq-research/localforage-asyncstorage-driver'
import { now } from './utils'
import localforage from 'localforage'
import semVer from 'compare-versions'

export default async function CacheFactory({
    name = 'RCache',
    version = '1.0.0',
    storeName = 'defaultCache',
    prune = true,
    allowStale = false,
    preferCache = true,
    ...rest
}: CacheOptions): Promise<CacheWrapper> {
    const config = {
        name: name ?? 'RCache',
        ...rest,
    }

    if (navigator?.product === 'ReactNative') {
        const AsyncStorageDriver = driverWithDefaultSerialization()
        await localforage.defineDriver(AsyncStorageDriver)
        await localforage.setDriver(AsyncStorageDriver._driver)
        if (config.driver) {
            delete config.driver
        }
    }

    localforage.config(config)
    await localforage.ready()

    const instance = localforage.createInstance({
        storeName,
    })
    const keys = await instance.keys()
    const items = await Promise.all(
        keys.map(
            async (key) => (await instance.getItem<CacheRecord>(key)) ?? key,
        ),
    )
    let records = items.filter(
        (item) => typeof item !== 'string' && item?.version,
    ) as CacheRecord[]
    if (
        records.some((record) => semVer.compare(record.version, version, '>'))
    ) {
        throw new VersionError(
            `existing record has newer version. StoreName: ${storeName}`,
        )
    }
    if (prune) {
        const invalidRecordKeys = [
            ...records
                .filter(
                    (record) =>
                        semVer.compare(record.version, version, '<') ||
                        (!!record?.expiration && record.expiration < now()),
                )
                .map((record) => record.key),
            ...items.filter((item) => typeof item === 'string'),
        ]
        records = records.filter(
            (record) => !invalidRecordKeys.includes(record.key),
        )

        await Promise.all(
            invalidRecordKeys.map((key) => async () =>
                await instance.removeItem(key as string),
            ),
        )
    }

    const cache = new Map(records.map((record) => [record.key, record]))
    return new CacheWrapper({
        allowStale,
        cache,
        instance,
        name,
        preferCache,
        version,
    })
}
