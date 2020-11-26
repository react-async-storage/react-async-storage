import { CacheError } from './errors'
import { MaxAge } from './types'

export const now = (): number => new Date().getTime()
export const handleExpiration = (maxAge: MaxAge): number => {
    if (typeof maxAge === 'number') {
        if (Number.isNaN(maxAge) || maxAge <= 0) {
            throw new CacheError('invalid value passed to maxAge')
        }
        return maxAge
    }
    const validUnits = [
        'second',
        'minute',
        'hour',
        'day',
        'week',
        'month',
        'year',
    ]
    const num = maxAge[0]
    const unit = maxAge[1]
    if (typeof num !== 'number' || Number.isNaN(num) || num <= 0) {
        throw new CacheError('invalid value passed to maxAge')
    }

    if (!validUnits.includes(unit)) {
        throw new CacheError(
            `invalid unit passed to maxAge. Unit should be one of: ${validUnits.join(
                ',',
            )}`,
        )
    }
    const asMsMap = {
        second: 1e3,
        minute: 6e4,
        hour: 36e5,
        day: 864e5,
        week: 6048e5,
        month: 26298e5,
        year: 315576e5,
    }
    return Math.round(num * asMsMap[unit])
}
