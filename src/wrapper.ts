import { driverWithDefaultSerialization } from '@aveq-research/localforage-asyncstorage-driver'
import AsyncStorage from '@react-native-community/async-storage'
import localforage from 'localforage'
import merge from 'lodash.merge'
export interface CacheObject<T> {
    expiration?: number
    data: T
}

export enum Errors {
    CACHE_ERROR = 'CACHE_ERROR',
    VALUE_ERROR = 'VALUE_ERROR',
}

const isRN = () =>
    navigator?.product === 'ReactNative' && typeof AsyncStorage !== 'undefined'
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

    private static _check<T extends CacheWrapper, K extends keyof T, R>(
        throwNoInit = true,
    ) {
        return function (target: T, key: K, descriptor: PropertyDescriptor) {
            const wrapped = descriptor.value as T[K]
            if (typeof wrapped === 'function') {
                Reflect.set(descriptor, 'value', async function (
                    ...args: any[]
                ) {
                    if (throwNoInit && !target.init) {
                        throw '<rn-cache-wrapper> cacheInit must be called before interacting with the cache'
                    } else if (!throwNoInit && target.init) {
                        throw '<rn-cache-wrapper> cacheInit must be called only once per instance'
                    }
                    return (await wrapped.apply(target, args)) as R
                })
                return descriptor
            }
        }
    }

    cache<R>(identifier: string, maxAge: number) {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const memoize = this.memoize
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const prefix = this._prefix
        return function (
            target: any,
            key: string,
            descriptor: PropertyDescriptor,
        ) {
            const wrapped = descriptor.value as (...args: any[]) => Promise<R>
            if (typeof wrapped === 'function') {
                Reflect.set(descriptor, 'value', async function (
                    ...args: any[]
                ) {
                    return memoize<R>(
                        wrapped,
                        prefix(`${identifier}:::${key}`),
                        maxAge,
                    )(...args)
                })
                return descriptor
            }
        }
    }

    @CacheWrapper._check(false)
    async config(): Promise<void> {
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
        await this.prune()
        this.init = true
    }

    @CacheWrapper._check()
    hasItem(key: string): boolean {
        return this.store.has(this._prefix(key))
    }

    @CacheWrapper._check()
    async getItem<T = any>(
        key: string,
        fallback?: T | null,
        throwErrors = false,
    ): Promise<T | null> {
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

    @CacheWrapper._check()
    async setItem(key: string, data: any, maxAge?: number): Promise<void> {
        const cacheObject: CacheObject<any> = { data }
        if (maxAge) {
            cacheObject['expiration'] = now() + maxAge
        }
        this.store.set(this._prefix(key), cacheObject)
        await this.localForage.setItem(this._prefix(key), cacheObject)
    }

    @CacheWrapper._check()
    async removeItem(key: string): Promise<void> {
        await this.localForage.removeItem(this._prefix(key))
        this.store.delete(this._prefix(key))
    }

    @CacheWrapper._check()
    async mergeItem<T>(key: string, value: T): Promise<T> {
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

    @CacheWrapper._check()
    async multiGetItem(keys: string[]): Promise<[string, any][]> {
        const promises = keys.map(
            async (key: string): Promise<[string, any]> => {
                const cachedObject = await this.getItem(key)
                return [key, cachedObject]
            },
        )
        return await Promise.all(promises)
    }

    @CacheWrapper._check()
    async multiSetItem(
        values: {
            key: string
            data: any
            maxAge?: number
        }[],
    ): Promise<void> {
        const promises = values.map(
            async ({ key, data, maxAge }): Promise<void> => {
                await this.setItem(key, data, maxAge ?? undefined)
            },
        )
        await Promise.all(promises)
    }

    @CacheWrapper._check()
    async multiRemoveItem(keys: string[]): Promise<void> {
        const promises = keys.map(
            async (key: string): Promise<void> => {
                await this.removeItem(key)
            },
        )
        await Promise.all(promises)
    }

    @CacheWrapper._check()
    memoize<R>(
        fn: (...args: any[]) => Promise<R>,
        key: string,
        maxAge: number,
    ): (...args: any[]) => Promise<R> {
        // TODO: check if use of arrow function is required here to avoid scoping issues. Possible binding as also required.
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

    @CacheWrapper._check()
    async keys(filtered = true): Promise<string[]> {
        const keys = await this.localForage.keys()
        return filtered ? keys.filter((key) => key.includes(this.name)) : keys
    }

    @CacheWrapper._check()
    async records(): Promise<[string, CacheObject<any> | null][]> {
        const keys = await this.keys()
        if (keys.length) {
            return await this.multiGetItem(keys)
        }
        return []
    }

    @CacheWrapper._check()
    async prune(): Promise<void> {
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

export type Wrapper = CacheWrapper
