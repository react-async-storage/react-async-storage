import { useEffect } from 'react'
import AsyncStorage from '@react-native-community/async-storage'
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
    prefix: string
    version: string
} = {
    cache: new Map(),
    init: false,
    prefix: 'RNC',
    version: 'NONE',
}

const now = (): number => new Date().getTime()
const prefixed = (key: string): string =>
    `${_context.prefix}:::${_context.version}:::${key}`
const isStale = (expiration?: number): boolean =>
    !!expiration && expiration < now()

export function cacheHasItem(key: string) {
    return _context.cache.has(prefixed(key))
}

export async function getCacheItem<T = any>(
    key: string,
    fallback?: T | null,
    throwErrors = false,
): Promise<T | null> {
    let removeItem = false
    const record = _context.cache.get(prefixed(key))
    if (!isStale(record?.expiration)) {
        if (record?.data) {
            return record.data as T
        }
        const storedValue = await AsyncStorage.getItem(prefixed(key))
        if (storedValue) {
            const { expiration, data } = JSON.parse(storedValue)
            if (!isStale(expiration)) {
                return data as T
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
    const cacheObject: CacheObject<any> = { data }
    if (maxAge) {
        cacheObject['expiration'] = now() + maxAge
    }
    _context.cache.set(prefixed(key), cacheObject)
    await AsyncStorage.setItem(prefixed(key), JSON.stringify(cacheObject))
}

export async function removeCacheItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(prefixed(key))
    _context.cache.delete(prefixed(key))
}

export async function mergeCacheItem<T>(key: string, value: T): Promise<T> {
    /* 
        the async-storage library is using an outdated implementation of merge, 
        so we are not relying on it at all 
    */
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

export function memoizeAsync<R>(
    fn: (...args: any[]) => Promise<R>,
    maxAge: number,
): (...args: any[]) => Promise<R> {
    return async (...args: any[]) => {
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
    const keys = await AsyncStorage.getAllKeys()
    const filteredKeys = keys.filter((key) => key.includes(_context.prefix))

    if (filteredKeys.length) {
        const records = await AsyncStorage.multiGet(filteredKeys)
        return records.map(([key, value]) => [
            key,
            value ? JSON.parse(value) : null,
        ])
    }
    return []
}

export async function pruneRecords(): Promise<void> {
    const records = await allRecords()
    if (records.length) {
        const invalidRecords = records
            .filter(
                (record) =>
                    record[0].split(':::')[1] !== _context.version ||
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
            await AsyncStorage.multiRemove(invalidRecords)
        }

        _context.cache = new Map(
            parsedRecords.filter(
                (record) => !invalidRecords.includes(record[0]),
            ),
        )
    }
}

export function cacheInit(config?: {
    prefix?: string
    version?: string
}): void {
    if (_context.init) {
        throw '<rn-cache-wrapper> cacheInit should be called only once'
    }
    _context.prefix = config?.prefix ?? _context.prefix
    _context.version = config?.version ?? _context.version

    useEffect(() => {
        ;(async () => {
            await pruneRecords()
            _context.init = true
        })()
    }, [])
}

export default {
    has: cacheHasItem,
    get: getCacheItem,
    set: setCacheItem,
    remove: removeCacheItem,
    merge: mergeCacheItem,
    memoize: memoizeAsync,
    records: allRecords,
    prune: pruneRecords,
}
