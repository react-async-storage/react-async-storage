import AsyncStorage from '@react-native-community/async-storage'

export interface CacheObject<T> {
    expiration?: number
    memoize?: boolean
    data: T
}

const now = (): number => new Date().getTime()
const prefixed = (key: string): string => `${context.prefix}_${key}`
const isStale = (expiration?: number): boolean =>
    !!expiration && expiration < now()

const context: {
    prefix: string
    cache: Map<any, Partial<CacheObject<any>>>
} = {
    prefix: 'RNC',
    cache: new Map(),
}

export async function getCacheItem<T = any>({
    defaultValue,
    key,
    memoize = true,
    removeItem = false,
}: {
    defaultValue?: T
    key: string
    memoize?: boolean
    removeItem?: boolean
}): Promise<T | null> {
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
        await removeCacheItem({ key })
    }
    return defaultValue ?? null
}

export async function setCacheItem({
    key,
    data,
    maxAge,
    memoize = true,
}: {
    key: string
    data: any
    maxAge?: number
    memoize?: boolean
}): Promise<void> {
    const cacheObject: Record<string, any> = { data, memoize }
    if (maxAge) {
        cacheObject['expiration'] = now() + maxAge
    }
    if (memoize) {
        context.cache.set(prefixed(key), cacheObject)
    }
    await AsyncStorage.setItem(prefixed(key), JSON.stringify(cacheObject))
}

export async function removeCacheItem({ key }: { key: string }): Promise<void> {
    await AsyncStorage.removeItem(prefixed(key))
    context.cache.delete(prefixed(key))
}

export async function mergeCacheItem({
    key,
    value,
}: {
    key: string
    value: any
}): Promise<void> {
    await AsyncStorage.mergeItem(prefixed(key), JSON.stringify(value))
}

export function cacheAsync<R extends Promise<any>>({
    action,
    maxAge,
}: {
    action: (...args: any[]) => Promise<R>
    maxAge: number
}): (...args: any[]) => Promise<R> {
    return async (...args: any[]) => {
        const key = JSON.stringify(args)
        const cachedData = await getCacheItem({ key })
        if (cachedData) {
            return cachedData as R
        }
        const data = await action(...args)
        await setCacheItem({ key, data, maxAge })
        return data as R
    }
}

export async function cacheSetup(cachePrefix?: string): Promise<void> {
    if (cachePrefix) {
        context.prefix = cachePrefix
    }

    const keys = await AsyncStorage.getAllKeys()
    const filteredKeys = keys.filter((key) => key.includes(context.prefix))

    if (filteredKeys.length) {
        const records = await AsyncStorage.multiGet(filteredKeys)
        const nullRecords = records
            .filter((record) => !record[1])
            .map((record) => record[0])
        const parsedRecords = records
            .filter((record) => !nullRecords.includes(record[0]))
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

        if (nullRecords.length || staleRecords.length) {
            await AsyncStorage.multiRemove([...nullRecords, ...staleRecords])
        }

        context.cache = new Map([
            ...context.cache,
            ...parsedRecords.filter(
                ([key, value]) => !staleRecords.includes(key) && value.memoize,
            ),
        ])
    }
}
