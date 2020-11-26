import { Cache, CacheObject, CacheWrapperOptions } from './types'
import { CacheError } from './errors'
import { CacheRecord } from './record'
import { now } from './utils'
import merge from 'lodash.merge'

type Setter<T> = () => T
type UpdateSetter<T> = (value: T) => T

export class CacheWrapper {
    readonly name: string
    readonly version: string
    readonly instance: LocalForage
    readonly allowStale: boolean
    readonly preferCache: boolean
    cache: Cache = new Map()

    constructor(options: CacheWrapperOptions) {
        this.name = options.name
        this.version = options.version
        this.instance = options.instance
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
                ? (this.cache.get(key) as CacheRecord<T>)
                : await this.instance.getItem<CacheObject<T>>(key)

        if (record instanceof CacheRecord && !record.isStale()) {
            return record
        }
        if (!record) {
            if (!allowNull) {
                throw new CacheError(`null value returned for key ${key}`)
            }
            return null
        } else if (record.expiration && record.expiration < now()) {
            await this.removeItem(key)
            if (!allowNull) {
                throw new CacheError(
                    `stale value return for key ${key}: to resolve this error allowNull when calling getRecord`,
                )
            }
            return null
        }

        return new CacheRecord(
            record.key,
            record.version,
            record.value,
            record.expiration,
        )
    }

    async updateRecord<T = any>(
        key: string,
        options?: {
            value?: T | UpdateSetter<T>
            maxAge?: number
            version?: string
        },
        callback?: (error: Error, value: CacheObject<T>) => void,
    ): Promise<CacheRecord<T>> {
        const record = (await this.getRecord<T>(key, false)) as CacheRecord<T>
        record.value =
            typeof options?.value === 'undefined'
                ? record.value
                : options.value instanceof Function
                ? options.value(record.value)
                : options.value
        record.expiration = options?.maxAge
            ? now() + options.maxAge
            : record.expiration
        record.version = options?.version ?? record.version
        try {
            await this.instance.setItem(key, record.toObject(), callback)
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
                returnValue = record.value
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
        value: Setter<T> | T,
        maxAge?: number,
        callback?: (error: Error | null, value?: CacheObject<T>) => void,
    ): Promise<void> {
        const expiration = maxAge ? now() + maxAge : undefined
        const record = new CacheRecord<T>(
            key,
            this.version,
            value instanceof Function ? value() : value,
            expiration,
        )
        try {
            await this.instance.setItem(key, record.toObject(), callback)
            this.cache.set(key, record)
        } catch (error) {
            throw new CacheError(`error writing key ${key}.`)
        }
    }

    async removeItem(
        key: string,
        callback?: (error: Error) => void,
    ): Promise<void> {
        await this.instance.removeItem(key, callback)
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
                { value: (val: T) => merge(val, value) },
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
        await this.instance.clear(callback)
        this.cache.clear()
    }

    async keys(
        callback?: (error: Error | null, keys: string[]) => void,
    ): Promise<string[]> {
        return await this.instance.keys(callback)
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
