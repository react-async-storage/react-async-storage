import { TimeUnit } from '../src/types'
import { ValueError } from '../src/errors'
import { handleExpiration } from '../src/utils'

describe('utils tests', () => {
    describe('handleExpiration', () => {
        it('returns the passed in value when that value is a positive number', () => {
            expect(handleExpiration(1)).toEqual(1)
        })
        for (const [key, value] of Object.entries({
            second: 1e3,
            minute: 6e4,
            hour: 36e5,
            day: 864e5,
            week: 6048e5,
            month: 26298e5,
            year: 315576e5,
        })) {
            it(`parses ${key}s correcty`, () => {
                expect(handleExpiration([1, key as TimeUnit])).toEqual(value)
                expect(handleExpiration([2, key as TimeUnit])).toEqual(
                    value * 2,
                )
                expect(handleExpiration([1.5, key as TimeUnit])).toEqual(
                    value * 1.5,
                )
            })
        }
        it('throws when passed in value is NaN', () => {
            try {
                handleExpiration(NaN)
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
        it('throws when passed in value is negative', () => {
            try {
                handleExpiration(-1)
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
        it('throws when passed in value is zero', () => {
            try {
                handleExpiration(0)
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
        it('throws when passed in value is zero in array', () => {
            try {
                handleExpiration([0, 'day'])
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
        it('throws when passed in value is negative in array', () => {
            try {
                handleExpiration([-1, 'day'])
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
        it('throws when passed in unit is invalid', () => {
            try {
                //@ts-ignore
                handleExpiration([1, 'days'])
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
    })
})
