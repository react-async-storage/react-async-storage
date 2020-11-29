import {
    Cache,
    CacheWrapperOptions,
    MaxAge,
    NodeCallBack,
    Setter,
    UpdateSetter,
} from './types'
import { CacheError } from './errors'
import { CacheRecord } from './record'
import merge from 'lodash.merge'

export class CacheWrapper {
    readonly allowStale: boolean
    readonly cache: Cache = new Map()
    readonly instance: LocalForage
    readonly storeName: string
    readonly preferCache: boolean
    readonly version: string

    constructor(options: CacheWrapperOptions) {
        this.allowStale = options.allowStale
        this.cache = options.cache
        this.instance = options.instance
        this.storeName = options.storeName
        this.preferCache = options.preferCache
        this.version = options.version
    }

    hasItem(key: string): boolean {
        return this.cache.has(key)
    }

    async getRecord<T = any>(
        key: string,
        {
            allowNull = true,
            preferCache = this.preferCache,
        }: { allowNull?: boolean; preferCache?: boolean } = {},
    ): Promise<CacheRecord<T> | null> {
        let record = (this.hasItem(key) && preferCache
            ? this.cache.get(key)
            : await this.instance.getItem(key)) as CacheRecord<T> | null
        if (record === null) {
            if (!allowNull) {
                throw new CacheError(`null value returned for key ${key}`)
            }
            return null
        }
        record =
            record instanceof CacheRecord ? record : CacheRecord.from(record)
        if (record.isStale()) {
            await this.removeItem(key)
            if (!allowNull) {
                throw new CacheError(
                    `stale value return for key ${key}: to resolve this error allowNull when calling getRecord`,
                )
            }
            return null
        }
        return record
    }

    async updateRecord<T = any>(
        key: string,
        options?: {
            value?: UpdateSetter<T> | T
            maxAge?: MaxAge
            version?: string
        } | null,
        callback?: NodeCallBack<CacheRecord<T>>,
    ): Promise<CacheRecord<T>> {
        const record = (await this.getRecord(key, {
            allowNull: false,
        })) as CacheRecord<T>
        if (options?.value) {
            record.setValue(options.value)
        }
        if (options?.maxAge) {
            record.setExpiration(options.maxAge)
        }
        record.version = options?.version ?? record.version
        try {
            await this.instance.setItem(key, record.toObject())
            this.cache.set(key, record)
            if (callback) {
                callback(null, record)
            }
        } catch (error) {
            if (!callback) {
                throw new CacheError(`error writing key ${key}`)
            }
            callback(error)
        }
        return record
    }

    async getItem<T = any>(
        key: string,
        {
            fallback = null,
            allowNull = true,
        }: {
            fallback?: T | null
            allowNull?: boolean
            preferCache?: boolean
        } = {},
        callback?: NodeCallBack<T | null>,
    ): Promise<T | null> {
        let returnValue = fallback
        try {
            const record = await this.getRecord<T>(key, {
                allowNull: !!fallback || allowNull,
            })
            if (record) {
                returnValue = record.value
            }
            if (callback) {
                callback(null, returnValue)
            }
            return returnValue
        } catch (error) {
            if (!callback) {
                throw error
            }
            callback(error)
        }
        return null
    }

    async setItem<T = any>(
        key: string,
        value: Setter<T> | T,
        maxAge?: MaxAge,
        callback?: NodeCallBack<CacheRecord<T>>,
    ): Promise<void> {
        try {
            const record = new CacheRecord<T>(key, this.version, value, maxAge)
            await this.instance.setItem(key, record.toObject())
            this.cache.set(key, record)
            if (callback) {
                callback(null, record)
            }
        } catch (error) {
            if (callback) {
                callback(error)
            } else {
                throw new CacheError(`error writing key ${key}`)
            }
        }
    }

    async removeItem(
        key: string,
        callback?: NodeCallBack<never>,
    ): Promise<void> {
        await this.instance.removeItem(key, callback)
        this.cache.delete(key)
    }

    async mergeItem<T>(
        key: string,
        value: T,
        callback?: NodeCallBack<T>,
    ): Promise<T | void> {
        try {
            const { value: mergedValue } = await this.updateRecord(key, {
                value: (val: T) => merge(val, value),
            })
            if (callback) {
                callback(null, mergedValue)
            }
            return mergedValue
        } catch (error) {
            if (!callback) {
                throw new CacheError(`error merging values for key ${key}`)
            }
            callback(error)
        }
    }

    async multiGet(keys: string[]): Promise<[string, any][]> {
        const promises = keys.map(
            async (key: string): Promise<[string, any]> => {
                const cachedValue = await this.getItem(key)
                return [key, cachedValue]
            },
        )
        return await Promise.all(promises)
    }

    async multiSet(
        values: {
            key: string
            value: any
            maxAge?: MaxAge
        }[],
    ): Promise<void> {
        const promises = values.map(
            async ({ key, value, maxAge }): Promise<void> => {
                await this.setItem(key, value, maxAge)
            },
        )
        await Promise.all(promises)
    }

    async multiRemove(keys: string[]): Promise<void> {
        const promises = keys.map(
            async (key): Promise<void> => {
                await this.removeItem(key)
            },
        )
        await Promise.all(promises)
    }

    async clear(callback?: NodeCallBack<never>): Promise<void> {
        await this.instance.clear(callback)
        this.cache.clear()
    }

    async keys(callback?: NodeCallBack<string[]>): Promise<string[]> {
        return await this.instance.keys(callback)
    }

    async getRecords(
        preferCache = true,
        callback?: NodeCallBack<CacheRecord[]>,
    ): Promise<CacheRecord[]> {
        let records: CacheRecord[] = []
        try {
            const keys = await this.keys()
            if (keys.length) {
                const promises = keys.map(
                    async (key) => await this.getRecord(key, { preferCache }),
                )
                records = (await Promise.all(promises)).filter(
                    (record) => !!record,
                ) as CacheRecord[]
            }
            if (callback) {
                callback(null, records)
            }
        } catch (error) {
            if (!callback) {
                throw error
            }
            callback(error)
        }
        return records
    }
}
