import { Cache, CacheObject, CacheWrapperOptions } from './types'
import { CacheError } from './errors'
import { CacheRecord } from './record'
import { now } from './utils'
import localforage from 'localforage'
import merge from 'lodash.merge'

export class CacheWrapper {
    readonly name: string
    readonly version: string
    readonly localForage: LocalForage = localforage
    readonly allowStale: boolean
    readonly preferCache: boolean
    private readonly cache: Cache = new Map()

    constructor(options: CacheWrapperOptions) {
        this.name = options.name
        this.version = options.version
        this.localForage = options.instance
        this.cache = options.cache
        this.allowStale = options.allowStale
        this.preferCache = options.preferCache
    }

    hasItem(key: string): boolean {
        return this.cache.has(key)
    }

    async getRecord<T = any>(
        key: string,
        allowNull = true,
        preferCache = this.preferCache,
    ): Promise<CacheRecord<T> | null> {
        const record =
            this.hasItem(key) && preferCache
                ? this.cache.get(key)
                : await this.localForage.getItem<CacheObject<T>>(key)
        if (!record) {
            if (!allowNull) {
                throw new CacheError(`null value returned for key ${key}`)
            }
            return null
        } else if (record instanceof CacheRecord) {
            return record as CacheRecord<T>
        }
        return new CacheRecord<T>(
            key,
            this.version,
            record.value,
            record.expiration,
        )
    }

    async updateRecord<T = any>(
        key: string,
        value?: (value: T) => T | T,
        maxAge?: number,
        callback?: (error: Error, value: CacheObject<T>) => void,
    ): Promise<CacheRecord<T>> {
        const record = (await this.getRecord<T>(key, false)) as CacheRecord<T>
        record.value =
            typeof value === 'undefined'
                ? record.value
                : typeof value === 'function'
                ? value(record.value)
                : value
        record.expiration = maxAge ? now() + maxAge : record.expiration
        try {
            await this.localForage.setItem(key, record.toObject(), callback)
            this.cache.set(key, record)
        } catch (error) {
            throw new CacheError(`error writing key ${key}.`)
        }
        return record
    }

    async getItem<T = any>(
        key: string,
        fallback: T | null = null,
        allowNull = true,
        preferCache = this.preferCache,
        callback?: (error: Error | null, value?: T | null) => void,
    ): Promise<T | null> {
        let returnValue = fallback
        try {
            const record = await this.getRecord<T>(
                key,
                !!fallback || allowNull,
                preferCache,
            )
            if (record) {
                if (!record.isStale) {
                    returnValue = record.value
                } else {
                    await this.removeItem(key)
                }
            }
            if (callback) {
                callback(null, returnValue)
            }
        } catch (error) {
            if (callback) {
                callback(error)
            } else if (error instanceof CacheError) {
                throw error
            } else {
                throw new CacheError(`error retrieving key ${key}.`)
            }
        }
        return returnValue
    }

    async setItem<T = any>(
        key: string,
        value: () => T | T,
        maxAge?: number,
        callback?: (error: Error | null, value?: CacheObject<T>) => void,
    ): Promise<void> {
        const expiration = maxAge ? now() + maxAge : undefined
        const record = new CacheRecord<T>(
            key,
            this.version,
            typeof value === 'function' ? value() : value,
            expiration,
        )
        try {
            await this.localForage.setItem(key, record.toObject(), callback)
            this.cache.set(key, record)
        } catch (error) {
            throw new CacheError(`error writing key ${key}.`)
        }
    }

    async removeItem(
        key: string,
        callback?: (error: Error) => void,
    ): Promise<void> {
        await this.localForage.removeItem(key, callback)
        this.cache.delete(key)
    }

    async mergeItem<T>(
        key: string,
        value: T,
        callback?: (error: Error | null, value?: CacheObject<T>) => void,
    ): Promise<T> {
        try {
            const { value: mergedValue } = await this.updateRecord(
                key,
                (val: T) => merge(val, value),
                undefined,
                callback,
            )
            return mergedValue
        } catch (error) {
            if (error instanceof CacheError) {
                throw error
            }
            throw new CacheError(`error merging values for key ${key}.`)
        }
    }

    async multiGet(keys: string[]): Promise<[string, any][]> {
        const promises = keys.map(
            async (key: string): Promise<[string, any]> => {
                const cachedObject = await this.getItem(key)
                return [key, cachedObject]
            },
        )
        return await Promise.all(promises)
    }

    async multiSet(
        values: {
            key: string
            value: any
            maxAge?: number
        }[],
    ): Promise<void> {
        const promises = values.map(
            async ({ key, value, maxAge }): Promise<void> => {
                await this.setItem(key, value, maxAge ?? undefined)
            },
        )
        await Promise.all(promises)
    }

    async multiRemove(keys: string[]): Promise<void> {
        const promises = keys.map(
            async (key: string): Promise<void> => {
                await this.removeItem(key)
            },
        )
        await Promise.all(promises)
    }

    async clear(callback?: (error: Error) => void): Promise<void> {
        await this.localForage.clear(callback)
        this.cache.clear()
    }

    async keys(
        callback?: (error: Error | null, keys: string[]) => void,
    ): Promise<string[]> {
        return await this.localForage.keys(callback)
    }

    async getRecords(
        preferCache = true,
        callback?: (error: Error | null, records?: CacheRecord[]) => void,
    ): Promise<CacheRecord[]> {
        let records: CacheRecord[] = []
        try {
            const keys = await this.keys()
            if (keys.length) {
                const promises = keys.map(
                    async (key) => await this.getRecord(key, true, preferCache),
                )
                records = (await Promise.all(promises)).filter(
                    (record) => !!record,
                ) as CacheRecord[]
            }
            if (callback) {
                callback(null, records)
            }
        } catch (error) {
            if (callback) {
                callback(error)
            } else {
                throw error
            }
        }
        return records
    }
}
