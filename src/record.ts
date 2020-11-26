import { CacheObject } from './types'
import { now } from './utils'

export class CacheRecord<T = any> {
    public key: string
    public version: string
    public value: T
    public expiration?: number

    constructor(key: string, version: string, value: T, expiration?: number) {
        this.key = key
        this.version = version
        this.value = value
        this.expiration = expiration
    }

    isStale(): boolean {
        return !!this.expiration && this.expiration < now()
    }

    toObject = (): CacheObject<T> => {
        return {
            expiration: this.expiration,
            key: this.key,
            value: this.value,
            version: this.version,
        }
    }
}
