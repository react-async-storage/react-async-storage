import { CacheRecord } from './record'

export type Cache = Map<string, CacheRecord>
export interface CacheObject<T = any> {
    expiration?: number
    key: string
    value: T
    version: string
}
export interface CacheWrapperOptions {
    instance: LocalForage
    storeName: string
    version: string
    cache: Cache
    allowStale: boolean
    preferCache: boolean
}

export interface StorageOptions extends Omit<LocalForageOptions, 'version'> {
    version?: string
    prune?: boolean
    allowStale?: boolean
    preferCache?: boolean
}

export type TimeUnit =
    | 'second'
    | 'minute'
    | 'hour'
    | 'day'
    | 'week'
    | 'month'
    | 'year'

export type MaxAge = number | [number, TimeUnit]
export type NodeCallBack<T = any> = (error: Error | null, value?: T) => void
export type Setter<T> = () => T
export type UpdateSetter<T> = (value: T) => T
export interface StorageProviderProps {
    onReady?: () => void
    options?: StorageOptions | StorageOptions[]
}
