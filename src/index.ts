import AsyncStorage from '@react-native-community/async-storage'

export interface CacheObject<T> {
    expiration?: number
    memoize?: boolean
    data: T
}

const context: {
    prefix: string
    version: string
    cache: Map<any, Partial<CacheObject<any>>>
} = {
    prefix: 'RNC',
    version: 'NONE',
    cache: new Map(),
}

const now = (): number => new Date().getTime()
const prefixed = (key: string): string =>
    `${context.prefix}:::${context.version}:::${key}`
const isStale = (expiration?: number): boolean =>
    !!expiration && expiration < now()

export async function getCacheItem<T = any>(
    key: string,
    fallback?: T | null,
    options?: { removeItem: boolean; memoize: boolean },
): Promise<T | null> {
    let removeItem = options?.removeItem ?? false
    const memoize = options?.memoize ?? true
    const record = context.cache.get(prefixed(key))
    if (!isStale(record?.expiration)) {
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
        context.cache.set(prefixed(key), cacheObject)
    }
    await AsyncStorage.setItem(prefixed(key), JSON.stringify(cacheObject))
}

export async function removeCacheItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(prefixed(key))
    context.cache.delete(prefixed(key))
}

export async function mergeCacheItem(key: string, value: any): Promise<void> {
    await AsyncStorage.mergeItem(prefixed(key), JSON.stringify(value))
}

export function cacheAsync<R extends Promise<any>>(
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

export async function cacheSetup({
    cachePrefix,
    version,
}: {
    cachePrefix?: string
    version?: string
}): Promise<void> {
    if (cachePrefix) {
        context.prefix = cachePrefix
    }
    if (version) {
        context.version = version
    }

    const keys = await AsyncStorage.getAllKeys()
    const filteredKeys = keys.filter((key) => key.includes(context.prefix))

    if (filteredKeys.length) {
        const records = await AsyncStorage.multiGet(filteredKeys)
        const outDatedRecords = records
            .filter((record) => record[0].split(':::')[1] !== context.version)
            .map((record) => record[0])
        const nullRecords = records
            .filter((record) => !record[1])
            .map((record) => record[0])
        const parsedRecords = records
            .filter(
                (record) =>
                    !nullRecords.includes(record[0]) &&
                    !outDatedRecords.includes(record[0]),
            )
            .map(
                ([key, value]) =>
                    [key, JSON.parse(value ?? '')] as [
                        string,
                        CacheObject<any>,
                    ],
            )
        const staleRecords = parsedRecords
            .filter((record) => isStale(record[1].expiration))
            .map((record) => record[0])

        if (
            outDatedRecords.length ||
            nullRecords.length ||
            staleRecords.length
        ) {
            await AsyncStorage.multiRemove([
                ...outDatedRecords,
                ...nullRecords,
                ...staleRecords,
            ])
        }

        context.cache = new Map(
            parsedRecords.filter(
                ([key, value]) => !staleRecords.includes(key) && value.memoize,
            ),
        )
    }
}
