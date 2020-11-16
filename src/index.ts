import { useEffect } from 'react'
import AsyncStorage from '@react-native-community/async-storage'
import merge from 'lodash.merge'

export interface CacheObject<T> {
    expiration?: number
    memoize?: boolean
    data: T
}

export enum Errors {
    CACHE_ERROR = 'CACHE_ERROR',
    VALUE_ERROR = 'VALUE_ERROR',
}

interface Options {
    removeItem?: boolean
    memoize?: boolean
    allowStale?: boolean
    throwErrors?: boolean
}

const _context: {
    cache: Map<any, Partial<CacheObject<any>>>
    init: boolean
    options: Options
    prefix: string
    version: string
} = {
    cache: new Map(),
    init: false,
    options: {
        memoize: true,
        allowStale: false,
        removeItem: true,
        throwErrors: false,
    },
    prefix: 'RNC',
    version: 'NONE',
}

const now = (): number => new Date().getTime()
const prefixed = (key: string): string =>
    `${_context.prefix}:::${_context.version}:::${key}`
const isStale = (expiration?: number): boolean =>
    !!expiration && expiration < now()

export const cacheHasItem = (key: string) => _context.cache.has(prefixed(key))

export async function getCacheItem<T = any>(
    key: string,
    fallback?: T | null,
    options?: Options,
): Promise<T | null> {
    //eslint-disable-next-line
    let { removeItem, memoize, allowStale, throwErrors } = { ..._context.options, ...options }

    const record = _context.cache.get(prefixed(key))
    if (!isStale(record?.expiration) || allowStale) {
        if (record?.data && memoize) {
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
    options?: { maxAge?: number; memoize?: boolean },
): Promise<void> {
    const memoize = options?.memoize ?? true
    const cacheObject: CacheObject<any> = { data, memoize }
    if (options?.maxAge) {
        cacheObject['expiration'] = now() + options.maxAge
    }
    if (memoize) {
        _context.cache.set(prefixed(key), cacheObject)
    }
    await AsyncStorage.setItem(prefixed(key), JSON.stringify(cacheObject))
}

export async function removeCacheItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(prefixed(key))
    _context.cache.delete(prefixed(key))
}

export async function mergeCacheItem<T>(
    key: string,
    value: T,
    lodash: false,
): Promise<void> {
    if (typeof value !== 'object') {
        throw '<rn-cache-wrapper> merge value must be of typeof object'
    }
    const useLodashMerge = async () => {
        const storedValue = await getCacheItem<T>(key, null, {
            throwErrors: false,
        })
        if (storedValue === null || typeof storedValue !== 'object') {
            throw Errors.VALUE_ERROR
        }
        const mergedValue = merge(storedValue, value)
        await setCacheItem(key, mergedValue)
    }
    if (lodash) {
        await useLodashMerge()
    } else {
        try {
            await AsyncStorage.mergeItem(prefixed(key), JSON.stringify(value))
        } catch (error) {
            await useLodashMerge()
        }
    }
}

export function memoizeAsync<R extends Promise<any>>(
    action: (...args: any[]) => Promise<R>,
    maxAge: number,
): (...args: any[]) => Promise<R> {
    return async (...args: any[]) => {
        const key = `${action.name ?? 'NAMELESS'}_${JSON.stringify(args)}`
        const cachedData = await getCacheItem(key)
        if (cachedData) {
            return cachedData as R
        }
        const data = await action(...args)
        await setCacheItem(key, data, { maxAge })
        return data as R
    }
}

export async function allRecords(): Promise<
    ReturnType<typeof AsyncStorage.multiGet>
> {
    const keys = await AsyncStorage.getAllKeys()
    const filteredKeys = keys.filter((key) => key.includes(_context.prefix))

    if (filteredKeys.length) {
        return await Promise.all(
            filteredKeys.map(async (key) => {
                const value = await getCacheItem(key, null, {
                    throwErrors: false,
                })
                return [key, value] as [string, any]
            }),
        )
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
        const parsedRecords = records
            .filter((record) => !invalidRecords.includes(record[0]))
            .map(
                ([key, value]) =>
                    [key, JSON.parse(value ?? '')] as [
                        string,
                        CacheObject<any>,
                    ],
            )
        invalidRecords.concat(
            parsedRecords
                .filter((record) => isStale(record[1].expiration))
                .map((record) => record[0]),
        )

        if (invalidRecords.length) {
            await AsyncStorage.multiRemove(invalidRecords)
        }

        _context.cache = new Map(
            parsedRecords.filter(
                ([key, value]) =>
                    value.memoize && !invalidRecords.includes(key),
            ),
        )
    }
}

export function cacheInit(config?: {
    prefix?: string
    version?: string
    defaults?: Options
}): void {
    if (_context.init) {
        throw '<rn-cache-wrapper> cacheInit should be called only once'
    }
    _context.options = { ..._context.options, ...config?.defaults }
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
