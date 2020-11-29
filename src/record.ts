import { CacheObject, MaxAge, Setter, UpdateSetter } from './types'
import { ValueError } from './errors'

const now = (): number => new Date().getTime()
export class CacheRecord<T = any> {
    public key: string
    public version: string
    public value: T
    public expiration?: number

    constructor(
        key: string,
        version: string,
        value: T | Setter<T>,
        maxAge?: MaxAge,
    ) {
        this.key = key
        this.version = version
        //@ts-expect-error - https://github.com/microsoft/TypeScript/issues/37663
        this.value = typeof value === 'function' ? value() : value
        this.setExpiration(maxAge)
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
    setExpiration(maxAge?: MaxAge): void {
        if (!maxAge) {
            this.expiration = undefined
            return
        }
        if (typeof maxAge === 'number') {
            if (Number.isNaN(maxAge) || maxAge <= 0) {
                throw new ValueError('invalid value passed to maxAge')
            }
            this.expiration = now() + maxAge
            return
        }
        const unitToMSMap = {
            second: 1e3,
            minute: 6e4,
            hour: 36e5,
            day: 864e5,
            week: 6048e5,
            month: 26298e5,
            year: 315576e5,
        }
        const num = maxAge[0]
        if (typeof num !== 'number' || Number.isNaN(num) || num <= 0) {
            throw new ValueError('invalid value passed to maxAge')
        }
        const unit = maxAge[1]
        const validUnits = Object.keys(unitToMSMap)
        if (!validUnits.includes(unit)) {
            throw new ValueError(
                `invalid unit passed to maxAge. Unit should be one of: ${validUnits.join(
                    ',',
                )}`,
            )
        }
        this.expiration = num * unitToMSMap[unit] + now()
    }
    setValue(value: UpdateSetter<T> | T) {
        //@ts-expect-error - https://github.com/microsoft/TypeScript/issues/37663
        this.value = typeof value === 'function' ? value(this.value) : value
    }
    static from<T>(cacheObject: CacheObject<T>): CacheRecord<T> {
        const record = new CacheRecord<T>(
            cacheObject.key,
            cacheObject.version,
            cacheObject.value,
        )
        record.expiration = cacheObject.expiration
        return record
    }
}
