import { MaxAge } from './types'
import { ValueError } from './errors'

export const now = (): number => new Date().getTime()
export const handleExpiration = (maxAge: MaxAge): number => {
    if (typeof maxAge === 'number') {
        if (Number.isNaN(maxAge) || maxAge <= 0) {
            throw new ValueError('invalid value passed to maxAge')
        }
        return maxAge
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
    return num * unitToMSMap[unit]
}
