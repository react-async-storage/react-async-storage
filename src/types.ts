import { StorageRecord } from './record'

export type Cache = Map<string, StorageRecord>
export interface StorageObject<T = any> {
    expiration?: number
    key: string
    value: T
    version: string
}

export interface StorageOptions
    extends Omit<Omit<LocalForageOptions, 'version'>, 'name'> {
    namespace?: string
    version?: string
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
