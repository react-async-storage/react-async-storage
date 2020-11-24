import { Cache, CacheObject, CacheWrapperOptions } from './types'
import { CacheError } from './errors'
import { CacheRecord } from './record'
import { now } from './utils'
import localforage from 'localforage'
import merge from 'lodash.merge'

export class CacheWrapper {
    init = false
    readonly name: string
    readonly version: string
    readonly localForage: LocalForage = localforage
    readonly allowStale: boolean
    private readonly cache: Cache = new Map()

    constructor(options: CacheWrapperOptions) {
        this.name = options.name
        this.version = options.version
        this.localForage = options.instance
        this.cache = options.cache
        this.allowStale = options.allowStale
    }

    hasItem(key: string): boolean {
        return this.cache.has(key)
    }

    async getRecord<T = any>(
        key: string,
        fallback?: T | null,
        allowNull = true,
    ): Promise<CacheRecord<T> | null> {
        const record = this.hasItem(key)
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

    async getItem<T = any>(
        key: string,
        fallback?: T | null,
        allowNull = true,
    ): Promise<T | null> {
        const record = await this.getRecord(key, fallback, allowNull)
        if (record) {
            if (!record.isStale) {
                return record.value
            } else {
                await this.removeItem(key)
            }
        }
        return fallback ?? null
    }

    async setItem(key: string, value: any, maxAge?: number): Promise<void> {
        const expiration = maxAge ? now() + maxAge : undefined
        const record = new CacheRecord(key, this.version, value, expiration)
        this.cache.set(key, record)
        await this.localForage.setItem(key, record.asObject)
    }

    async removeItem(key: string): Promise<void> {
        await this.localForage.removeItem(key)
        this.cache.delete(key)
    }

    async mergeItem<T>(key: string, value: T): Promise<T> {
        if (!value || typeof value !== 'object') {
            throw new CacheError('merge value must be of typeof object')
        }
        const storedValue = await this.getItem<T>(key)
        if (!storedValue || typeof storedValue !== 'object') {
            throw new CacheError('merge target must be of typeof object')
        }
        const mergedValue = merge(storedValue, value)
        await this.setItem(key, mergedValue)
        return mergedValue
    }

    async multiGetItem(keys: string[]): Promise<[string, any][]> {
        const promises = keys.map(
            async (key: string): Promise<[string, any]> => {
                const cachedObject = await this.getItem(key)
                return [key, cachedObject]
            },
        )
        return await Promise.all(promises)
    }

    async multiSetItem(
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

    async multiRemoveItem(keys: string[]): Promise<void> {
        const promises = keys.map(
            async (key: string): Promise<void> => {
                await this.removeItem(key)
            },
        )
        await Promise.all(promises)
    }

    async clear(cb?: (error: any) => void): Promise<void> {
        await this.localForage.clear(cb)
        this.cache.clear()
    }

    async keys(filtered = true): Promise<string[]> {
        const keys = await this.localForage.keys()
        return filtered ? keys.filter((key) => key.includes(this.name)) : keys
    }

    async getRecords(preferCache = true): Promise<CacheRecord[]> {
        const keys = await this.keys()
        if (keys.length) {
            const promises = keys.map(async (key) => {
                if (preferCache && this.cache.has(key)) {
                    return this.cache.get(key)
                }
                return await this.getRecord(key)
            })
            const records = await Promise.all(promises)
            return records.filter((record) => !!record) as CacheRecord[]
        }
        return []
    }
}
