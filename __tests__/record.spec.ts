import { CacheRecord } from '../src'
import { TimeUnit } from '../src/types'
import { ValueError } from '../src/errors'

describe('CacheRecord tests', () => {
    let record: CacheRecord
    beforeEach(() => {
        record = new CacheRecord('testRecord', '1.0.0', 'testValue')
    })
    describe('setExpiration', () => {
        const baseDate = new Date()
        const baseTime = baseDate.getTime()
        let spy: jest.SpyInstance
        beforeEach(() => {
            spy = jest
                .spyOn(global, 'Date')
                //@ts-ignore
                .mockImplementation(() => baseDate)
        })
        afterEach(() => {
            spy.mockRestore()
        })
        it('returns the passed in value when that value is a positive number', () => {
            record.setExpiration(1)
            expect(record.expiration).toEqual(baseTime + 1)
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
                record.setExpiration([1, key as TimeUnit])
                expect(record.expiration).toEqual(baseTime + value)
                record.setExpiration([2, key as TimeUnit])
                expect(record.expiration).toEqual(baseTime + value * 2)
                record.setExpiration([1.5, key as TimeUnit])
                expect(record.expiration).toEqual(baseTime + value * 1.5)
            })
        }
        it('throws when passed in value is NaN', () => {
            try {
                record.setExpiration(NaN)
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
        it('throws when passed in value is negative', () => {
            try {
                record.setExpiration(-1)
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
        it('throws when passed in value is zero', () => {
            try {
                record.setExpiration(0)
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
        it('throws when passed in value is zero in array', () => {
            try {
                record.setExpiration([0, 'day'])
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
        it('throws when passed in value is negative in array', () => {
            try {
                record.setExpiration([-1, 'day'])
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
        it('throws when passed in unit is invalid', () => {
            try {
                //@ts-ignore
                record.setExpiration([1, 'days'])
            } catch (error) {
                expect(error).toBeInstanceOf(ValueError)
            }
        })
    })
})
