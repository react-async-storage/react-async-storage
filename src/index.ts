import { driverWithDefaultSerialization } from '@aveq-research/localforage-asyncstorage-driver'
import localforage from 'localforage'
import merge from 'lodash.merge'

interface CacheObject<T> {
    expiration?: number
    data: T
}

enum Errors {
    CACHE_ERROR = 'CACHE_ERROR',
    VALUE_ERROR = 'VALUE_ERROR',
}

const isRN = () => navigator?.product === 'ReactNative'
const now = (): number => new Date().getTime()
const isStale = (expiration?: number) => !!expiration && expiration < now()

export default class CacheWrapper {
    init = false
    readonly name: string
    readonly version: number
    readonly localForage: LocalForage = localforage
    private store: Map<any, Partial<CacheObject<any>>> = new Map()
    private options: LocalForageOptions

    constructor(options?: LocalForageOptions) {
        this.name = options?.name ?? 'ReactCacheWrapper'
        this.version = options?.version ?? 1.0
        this.options = options ?? {}
    }

    private _prefix(key: string): string {
        return `${this.name}:::${this.version}:::${key}`
    }

    private _check(throwNoInit = true) {
        if (throwNoInit && !this.init) {
            throw '<rn-cache-wrapper> cacheInit must be called before interacting with the cache'
        } else if (!throwNoInit && this.init) {
            throw '<rn-cache-wrapper> cacheInit must be called only once per instance'
        }
    }

    async config(): Promise<void> {
        this._check(false)
        if (isRN()) {
            const driver = driverWithDefaultSerialization()
            await localforage.defineDriver(driver)
            await localforage.setDriver(driver._driver)
            if (this.options.driver) {
                delete this.options.driver
            }
        }

        localforage.config({
            ...this.options,
            name: this.name,
            version: this.version,
        })

        await localforage.ready()
        this.init = true
        await this.prune()
    }

    hasItem(key: string): boolean {
        this._check()
        return this.store.has(this._prefix(key))
    }

    async getItem<T = any>(
        key: string,
        fallback?: T | null,
        throwErrors = false,
    ): Promise<T | null> {
        this._check()
        let removeItem = false
        const record = this.store.get(this._prefix(key))
        if (!isStale(record?.expiration)) {
            if (record?.data) {
                return record.data as T
            }
            const storedValue = await this.localForage.getItem<CacheObject<T>>(
                this._prefix(key),
            )
            if (storedValue) {
                const { expiration, data } = storedValue
                if (!isStale(expiration)) {
                    return data
                }
                removeItem = true
            }
        } else {
            removeItem = true
        }
        if (removeItem) {
            await this.removeItem(key)
        }
        if (throwErrors && !fallback) {
            throw Errors.VALUE_ERROR
        }
        return fallback ?? null
    }

    async setItem(key: string, data: any, maxAge?: number): Promise<void> {
        this._check()
        const cacheObject: CacheObject<any> = { data }
        if (maxAge) {
            cacheObject['expiration'] = now() + maxAge
        }
        this.store.set(this._prefix(key), cacheObject)
        await this.localForage.setItem(this._prefix(key), cacheObject)
    }

    async removeItem(key: string): Promise<void> {
        this._check()
        await this.localForage.removeItem(this._prefix(key))
        this.store.delete(this._prefix(key))
    }

    async mergeItem<T>(key: string, value: T): Promise<T> {
        this._check()
        if (!value || typeof value !== 'object') {
            throw '<rn-cache-wrapper> merge value must be of typeof object'
        }
        const storedValue = await this.getItem<T>(key)
        if (!storedValue || typeof storedValue !== 'object') {
            throw Errors.CACHE_ERROR
        }
        const mergedValue = merge(storedValue, value)
        await this.setItem(key, mergedValue)
        return mergedValue
    }

    async multiGetItem(keys: string[]): Promise<[string, any][]> {
        this._check()
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
            data: any
            maxAge?: number
        }[],
    ): Promise<void> {
        this._check()
        const promises = values.map(
            async ({ key, data, maxAge }): Promise<void> => {
                await this.setItem(key, data, maxAge ?? undefined)
            },
        )
        await Promise.all(promises)
    }

    async multiRemoveItem(keys: string[]): Promise<void> {
        this._check()
        const promises = keys.map(
            async (key: string): Promise<void> => {
                await this.removeItem(key)
            },
        )
        await Promise.all(promises)
    }

    memoize<R>(
        fn: (...args: any[]) => Promise<R>,
        key: string,
        maxAge: number,
    ): (...args: any[]) => Promise<R> {
        this._check()
        return async (...args: any[]) => {
            const cachedData = await this.getItem(key)
            if (cachedData) {
                return cachedData as R
            }
            const data = await fn(...args)
            await this.setItem(key, data, maxAge)
            return data
        }
    }

    async keys(filtered = true): Promise<string[]> {
        this._check()
        const keys = await this.localForage.keys()
        return filtered ? keys.filter((key) => key.includes(this.name)) : keys
    }

    async records(): Promise<[string, CacheObject<any> | null][]> {
        this._check()
        const keys = await this.keys()
        if (keys.length) {
            return await this.multiGetItem(keys)
        }
        return []
    }

    async prune(): Promise<void> {
        this._check()
        const records = await this.records()
        if (records.length) {
            const invalidRecords = records
                .filter(
                    (record) =>
                        record[0].split(':::')[1] !== this.version.toString() ||
                        !record[1],
                )
                .map((record) => record[0])

            const parsedRecords = records.filter(
                (record) => !invalidRecords.includes(record[0]),
            ) as [string, CacheObject<any>][]

            invalidRecords.concat(
                parsedRecords
                    .filter((record) => isStale(record[1]?.expiration))
                    .map((record) => record[0]),
            )

            if (invalidRecords.length) {
                await this.multiRemoveItem(invalidRecords)
            }

            this.store = new Map(
                parsedRecords.filter(
                    (record) => !invalidRecords.includes(record[0]),
                ),
            )
        }
    }
}
