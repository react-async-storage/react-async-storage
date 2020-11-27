import { CacheRecord } from '../src'
import { TimeUnit } from '../src/types'
import { ValueError } from '../src/errors'

describe('CacheRecord tests', () => {
    describe('constructor', () => {
        it('sets value when passed a function', () => {
            const setter = jest.fn(() => '123')
            const record = new CacheRecord('testRecord', '1.0.0', setter)
            expect(setter).toHaveBeenCalled()
            expect(record.value).toBe('123')
        })
        it('sets value when passed a regular value', () => {
            const record = new CacheRecord('testRecord', '1.0.0', '123')
            expect(record.value).toBe('123')
        })
        it('sets expiration when passed a number', () => {
            const record = new CacheRecord('testRecord', '1.0.0', '123', 1)
            expect(record.expiration).toBeTruthy()
        })
        it('sets expiration when passed an array', () => {
            const record = new CacheRecord('testRecord', '1.0.0', '123', [
                1,
                'day',
            ])
            expect(record.expiration).toBeTruthy()
        })
    })
    let record: CacheRecord
    beforeEach(() => {
        record = new CacheRecord('testRecord', '1.0.0', 'testValue')
    })
    describe('setValue', () => {
        it('sets value when passed a function', () => {
            expect(record.value).not.toBe('123')
            const setter = jest.fn(() => '123')
            record.setValue(setter)
            expect(setter).toHaveBeenCalled()
            expect(record.value).toBe('123')
        })
        it('sets value when passed a regular value', () => {
            expect(record.value).not.toBe('123')
            record.setValue('123')
            expect(record.value).toBe('123')
        })
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
