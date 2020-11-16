import { driverWithDefaultSerialization } from '@aveq-research/localforage-asyncstorage-driver'
import { useEffect } from 'react'
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

const _context: {
    cache: Map<any, Partial<CacheObject<any>>>
    init: boolean
    name: string
    rn: boolean
    store: LocalForage
    version: number
} = {
    cache: new Map(),
    init: false,
    name: 'RNC',
    rn:
        navigator?.product === 'ReactNative' &&
        typeof AsyncStorage !== 'undefined',
    store: localforage,
    version: 1.0,
}

const now = (): number => new Date().getTime()
const isStale = (expiration?: number) => !!expiration && expiration < now()
const prefixed = (key: string) =>
    `${_context.name}:::${_context.version}:::${key}`
const checkInit = (): void => {
    if (!_context.init)
        throw '<rn-cache-wrapper> cacheInit must be called before interacting with the cache'
}

export function cacheHasItem(key: string) {
    checkInit()
    return _context.cache.has(prefixed(key))
}

export async function getCacheItem<T = any>(
    key: string,
    fallback?: T | null,
    throwErrors = false,
): Promise<T | null> {
    checkInit()
    let removeItem = false
    const record = _context.cache.get(prefixed(key))
    if (!isStale(record?.expiration)) {
        if (record?.data) {
            return record.data as T
        }
        const storedValue = await _context.store.getItem<CacheObject<T>>(
            prefixed(key),
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
        await removeCacheItem(key)
    }
    if (throwErrors && !fallback) {
        throw Errors.VALUE_ERROR
    }
    return fallback ?? null
}

export async function setCacheItem(
    key: string,
    data: any,
    maxAge?: number,
): Promise<void> {
    checkInit()
    const cacheObject: CacheObject<any> = { data }
    if (maxAge) {
        cacheObject['expiration'] = now() + maxAge
    }
    _context.cache.set(prefixed(key), cacheObject)
    await _context.store.setItem(prefixed(key), cacheObject)
}

export async function removeCacheItem(key: string): Promise<void> {
    checkInit()
    await _context.store.removeItem(prefixed(key))
    _context.cache.delete(prefixed(key))
}

export async function mergeCacheItem<T>(key: string, value: T): Promise<T> {
    checkInit()
    if (!value || typeof value !== 'object') {
        throw '<rn-cache-wrapper> merge value must be of typeof object'
    }

    const storedValue = await getCacheItem<T>(key)
    if (!storedValue || typeof storedValue !== 'object') {
        throw Errors.CACHE_ERROR
    }
    const mergedValue = merge(storedValue, value)
    await setCacheItem(key, mergedValue)
    return mergedValue
}

export async function multiGetItem(keys: string[]): Promise<[string, any][]> {
    checkInit()
    const promises = keys.map(
        async (key: string): Promise<[string, any]> => {
            const cachedObject = await getCacheItem(key)
            return [key, cachedObject]
        },
    )
    return await Promise.all(promises)
}

export async function multiSetItem(
    values: {
        key: string
        data: any
        maxAge?: number
    }[],
): Promise<void> {
    checkInit()
    const promises = values.map(
        async ({ key, data, maxAge }): Promise<void> => {
            await setCacheItem(key, data, maxAge ?? undefined)
        },
    )
    await Promise.all(promises)
}

export async function multiRemoveItem(keys: string[]): Promise<void> {
    checkInit()
    const promises = keys.map(
        async (key: string): Promise<void> => {
            await removeCacheItem(key)
        },
    )
    await Promise.all(promises)
}

export function memoizeAsync<R>(
    fn: (...args: any[]) => Promise<R>,
    maxAge: number,
): (...args: any[]) => Promise<R> {
    return async (...args: any[]) => {
        checkInit()
        const key = `${fn.name ?? 'NAMELESS'}_${JSON.stringify(args)}`
        const cachedData = await getCacheItem(key)
        if (cachedData) {
            return cachedData as R
        }
        const data = await fn(...args)
        await setCacheItem(key, data, maxAge)
        return data
    }
}

export async function allRecords(): Promise<
    [string, CacheObject<any> | null][]
> {
    checkInit()
    const keys = await _context.store.keys()
    const filteredKeys = keys.filter((key) => key.includes(_context.name))

    if (filteredKeys.length) {
        return await multiGetItem(filteredKeys)
    }
    return []
}

export async function pruneRecords(): Promise<void> {
    checkInit()
    const records = await allRecords()
    if (records.length) {
        const invalidRecords = records
            .filter(
                (record) =>
                    record[0].split(':::')[1] !== _context.version.toString() ||
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
            await multiRemoveItem(invalidRecords)
        }

        _context.cache = new Map(
            parsedRecords.filter(
                (record) => !invalidRecords.includes(record[0]),
            ),
        )
    }
}

export function cacheInit(options: LocalForageOptions): void {
    if (_context.init) {
        throw '<rn-cache-wrapper> cacheInit should be called only once'
    }

    _context.name = options?.name ?? _context.name
    _context.version = options?.version ?? _context.version

    useEffect(() => {
        ;(async () => {
            if (_context.rn) {
                const driver = driverWithDefaultSerialization()
                await localforage.defineDriver(driver)
                await localforage.setDriver(driver._driver)
                if (options?.driver) {
                    delete options.driver
                }
            }

            localforage.config({
                ...options,
                name: _context.name,
                version: _context.version,
            })
            await localforage.ready()
            await pruneRecords()
            _context.init = true
        })()
    }, [])
}

export default {
    localforage,
    get: getCacheItem,
    has: cacheHasItem,
    memoize: memoizeAsync,
    merge: mergeCacheItem,
    multiGet: multiGetItem,
    multiRemove: multiRemoveItem,
    multiSet: multiSetItem,
    prune: pruneRecords,
    records: allRecords,
    remove: removeCacheItem,
    set: setCacheItem,
}
