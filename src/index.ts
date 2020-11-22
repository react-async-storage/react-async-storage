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

const toErrString = (msg: string) => `<R-Cache> ${msg}`
const isRN = () => navigator?.product === 'ReactNative'
const now = (): number => new Date().getTime()
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
            throw new Error(
                toErrString(
                    'config must be called before interacting with the cache',
                ),
            )
        } else if (!throwNoInit && this.init) {
            throw new Error(toErrString('config must be called only once'))
        }
    }

    async config(): Promise<void> {
        this._check(false)
        if (isRN()) {
            if (this.options.driver) {
                throw new Error(
                    toErrString('do not pass driver in ReactNative'),
                )
            }
            const driver = driverWithDefaultSerialization()
            await localforage.defineDriver(driver)
            await localforage.setDriver(driver._driver)
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
        const record = this.hasItem(key)
            ? this.store.get(this._prefix(key))
            : await this.localForage.getItem<CacheObject<T>>(this._prefix(key))
        if (record) {
            if (!record.expiration || record.expiration >= now()) {
                return record.data as T
            } else {
                await this.removeItem(key)
            }
        }
        if (throwErrors && !fallback) {
            throw new Error(Errors.VALUE_ERROR)
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
            throw new Error(toErrString('merge value must be of typeof object'))
        }
        const storedValue = await this.getItem<T>(key)
        if (!storedValue || typeof storedValue !== 'object') {
            throw new Error(Errors.CACHE_ERROR)
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
            value: any
            maxAge?: number
        }[],
    ): Promise<void> {
        this._check()
        const promises = values.map(
            async ({ key, value, maxAge }): Promise<void> => {
                await this.setItem(key, value, maxAge ?? undefined)
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

    async clear(cb?: (error: any) => void): Promise<void> {
        await this.localForage.clear(cb)
        this.store.clear()
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
                    .filter(
                        (record) =>
                            record[1]?.expiration &&
                            record[1].expiration < now(),
                    )
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
