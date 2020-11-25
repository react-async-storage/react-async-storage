import { CacheRecord } from './record'

export type Cache = Map<string, CacheRecord>
export interface CacheObject<T = any> {
    expiration?: number
    value: T
    version: string
}
export interface CacheWrapperOptions {
    instance: LocalForage
    name: string
    version: string
    cache: Cache
    allowStale: boolean
    preferCache: boolean
}

export interface CacheOptions extends Omit<LocalForageOptions, 'version'> {
    version?: string
    prune?: boolean
    allowStale: boolean
    preferCache: boolean
}

export interface LocalForageDbMethodsCore {
    getItem<T>(
        key: string,
        callback?: (err: any, value: T | null) => void,
    ): Promise<T | null>

    setItem<T>(
        key: string,
        value: T,
        callback?: (err: any, value: T) => void,
    ): Promise<T>

    removeItem(key: string, callback?: (err: any) => void): Promise<void>

    clear(callback?: (err: any) => void): Promise<void>

    length(callback?: (err: any, numberOfKeys: number) => void): Promise<number>

    key(
        keyIndex: number,
        callback?: (err: any, key: string) => void,
    ): Promise<string>

    keys(callback?: (err: any, keys: string[]) => void): Promise<string[]>

    iterate<T, U>(
        iteratee: (value: T, key: string, iterationNumber: number) => U,
        callback?: (err: any, result: U) => void,
    ): Promise<U>
}
