import AsyncStorage from '@react-native-community/async-storage'

interface CacheObject<T> {
    maxAge?: number
    created: number
    data: T
}

const now = (): number => new Date().getTime()
const prefixed = (key: string): string => `${context.prefix}_${key}`
const isStale = (created: number, maxAge?: number): boolean =>
    !!maxAge && maxAge + created > now()

const context: { prefix: string; cache: Record<string, number | undefined> } = {
    prefix: 'RNC',
    cache: {},
}

export async function getCacheItem<T = any>(
    key: string,
    defaultValue?: T,
): Promise<T | null> {
    const record = context.cache[prefixed(key)]
    if (!record || record < now()) {
        const storedValue = await AsyncStorage.getItem(prefixed(key))
        if (storedValue) {
            const { maxAge, created, data } = JSON.parse(
                storedValue,
            ) as CacheObject<T>
            if (!isStale(created, maxAge)) {
                return data
            } else {
                await removeCacheItem(prefixed(key))
            }
        }
    } else if (record > now()) {
        await removeCacheItem(prefixed(key))
    }
    return defaultValue ?? null
}

export async function setCacheItem(
    key: string,
    data: any,
    maxAge?: number,
): Promise<void> {
    const created = now()
    if (maxAge) {
        context.cache[prefixed(key)] = created + maxAge
    }
    await AsyncStorage.setItem(
        prefixed(key),
        JSON.stringify({
            data,
            maxAge,
            created,
        }),
    )
}

export async function removeCacheItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(prefixed(key))
    if (context.cache[prefixed(key)]) {
        delete context.cache[prefixed(key)]
    }
}

export async function mergeCacheItem(key: string, value: any): Promise<void> {
    await AsyncStorage.mergeItem(prefixed(key), JSON.stringify(value))
}

export async function cacheSetup(cachePrefix?: string): Promise<void> {
    if (cachePrefix) {
        context.prefix = cachePrefix
    }
    const keys = await AsyncStorage.getAllKeys()
    const filteredKeys = keys.filter((key) => key.includes(context.prefix))
    if (filteredKeys.length) {
        const records = await AsyncStorage.multiGet(filteredKeys)
        const staleRecords: string[] = []
        for (const [key, value] of records) {
            const { maxAge, created } =
                (JSON.parse(value ?? '') as CacheObject<any>) ?? {}
            if (created && isStale(created, maxAge)) {
                staleRecords.push(key)
            }
        }
        if (staleRecords.length) {
            await AsyncStorage.multiRemove(staleRecords)
        }
        records
            .filter((record) => !staleRecords.includes(record[0]))
            .forEach(([key, value]) => {
                const { maxAge, created } =
                    (JSON.parse(value ?? '') as CacheObject<any>) ?? {}
                if (maxAge) {
                    context.cache[key] = created + maxAge
                }
            })
    }
}
