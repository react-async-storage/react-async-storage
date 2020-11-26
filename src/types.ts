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
    name: string
    version: string
    cache: Cache
    allowStale: boolean
    preferCache: boolean
}

export interface CacheOptions extends Omit<LocalForageOptions, 'version'> {
    version?: string
    prune?: boolean
    allowStale?: boolean
    preferCache?: boolean
}
