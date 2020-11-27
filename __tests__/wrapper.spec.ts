import { CacheError } from '../src/errors'
import { CacheWrapper } from '../src/wrapper'
import cacheFactory from '../src'
import merge from 'lodash.merge'

describe('CacheWrapper tests', () => {
    let wrapper: CacheWrapper
    beforeEach(async () => {
        wrapper = await cacheFactory()
    })
    afterEach(async () => {
        await wrapper.clear()
        //@ts-ignore
        wrapper = null
    })
    const testValue = 'testValue 12345'
    describe('hasItem', () => {
        it('returns true/false correctly', async () => {
            expect(wrapper.hasItem('testValue')).toBeFalsy()
            await wrapper.setItem('testValue', testValue)
            expect(wrapper.hasItem('testValue')).toBeTruthy()
        })
    })
    describe('getRecord', () => {
        it('retrieves record from cache correctly', async () => {
            await wrapper.setItem('testValue', testValue)
            const record = await wrapper.getRecord('testValue')
            expect(record?.toObject()).toEqual({
                key: 'testValue',
                version: '1.0.0',
                value: testValue,
                expiration: undefined,
            })
        })
        it('retrieves record from storage correctly', async () => {
            await wrapper.setItem('testValue', testValue)
            const record = await wrapper.getRecord('testValue', {
                preferCache: false,
            })
            expect(record?.toObject()).toEqual({
                key: 'testValue',
                version: '1.0.0',
                value: testValue,
                expiration: undefined,
            })
        })
        it('throws an error when no value is returned and allowNull is false', async () => {
            try {
                await wrapper.getRecord('testValue', { allowNull: false })
            } catch (error) {
                expect(error).toBeInstanceOf(CacheError)
                expect(error.message).toBe(
                    `<R-Cache> null value returned for key testValue`,
                )
            }
        })
        it('returns null when allowNull is true and no value', async () => {
            const record = await wrapper.getRecord('testValue')
            expect(record).toBeNull()
        })
    })
    describe('getItem', () => {
        it('retrieves value without expiration correctly', async () => {
            await wrapper.setItem('testValue', testValue)
            expect(await wrapper.getItem('testValue')).toBe(testValue)
        })
        it('retrieves value with expiration correctly', async () => {
            await wrapper.setItem('testValue', testValue, 10)
            expect(wrapper.hasItem('testValue')).toBeTruthy()
            await new Promise((r) => setTimeout(r, 200))
            expect(wrapper.hasItem('testValue')).toBeTruthy()
            expect(await wrapper.getItem('testValue')).toBeNull()
            expect(wrapper.hasItem('testValue')).toBeFalsy()
        })
        it('throws error on no value when the option set to true', async () => {
            expect(await wrapper.getItem('testValue')).toBeNull()
            try {
                await wrapper.getItem('testValue', { allowNull: false })
            } catch (error) {
                expect(error.message).toBe(
                    '<R-Cache> null value returned for key testValue',
                )
            }
        })
        it('calls fallback when provided', async () => {
            const fallback = 'fallback'
            const result = await wrapper.getItem('testValue', { fallback })
            expect(result).toBe(fallback)
        })
        it('does not throw error when fallback is provided', async () => {
            const fallback = 'fallback'
            const result = await wrapper.getItem('testValue', {
                fallback,
                allowNull: false,
            })
            expect(result).toBe(fallback)
        })
    })
    describe('setItem', () => {
        it('sets items correctly without maxAge', async () => {
            expect(await wrapper.getItem('testValue')).toBeNull()
            await wrapper.setItem('testValue', testValue)
            expect(await wrapper.getItem('testValue')).toBe(testValue)
        })
        it('sets items correctly with maxAge', async () => {
            expect(await wrapper.getItem('testValue')).toBeNull()
            await wrapper.setItem('testValue', testValue, 10)
            expect(await wrapper.getItem('testValue')).toBe(testValue)
            await new Promise((r) => setTimeout(r, 200))
            expect(await wrapper.getItem('testValue')).toBeNull()
        })
    })

    describe('removeItem', () => {
        it('removes value correctly', async () => {
            await wrapper.setItem('testValue', testValue)
            expect(wrapper.hasItem('testValue')).toBeTruthy()
            expect(await wrapper.getItem('testValue')).toBe(testValue)
            await wrapper.removeItem('testValue')
            expect(wrapper.hasItem('testValue')).toBeFalsy()
            expect(await wrapper.getItem('testValue')).toBeNull()
        })
    })
    describe('mergeItem', () => {
        const value1 = { key1: 'value1' }
        const value2 = { key2: 'value2', key3: [1, 2, 3] }
        const merged = merge(value1, value2)
        it('merges stored values correctly', async () => {
            await wrapper.setItem('testValue', value1)
            expect(await wrapper.getItem('testValue')).toEqual(value1)
            const mergedResult = await wrapper.mergeItem('testValue', value2)
            expect(mergedResult).toEqual(merged)
            expect(await wrapper.getItem('testValue')).toEqual(merged)
        })
        it('throws an error when merge value is not an object', async () => {
            await wrapper.setItem('testValue', value1)
            try {
                await wrapper.mergeItem('testValue', 1)
            } catch (error) {
                expect(error.message).toBe(
                    '<R-Cache> merge value must be of typeof object',
                )
            }
        })
        it('throws an error when merge target is null', async () => {
            try {
                await wrapper.mergeItem('testValue', value2)
            } catch (error) {
                expect(error.message).toBe(
                    '<R-Cache> null value returned for key testValue',
                )
            }
        })
        it('throws an error when merge target is not an object', async () => {
            await wrapper.setItem('testValue', 1)
            try {
                await wrapper.mergeItem('testValue', value2)
            } catch (error) {
                expect(error.message).toBe(
                    '<R-Cache> error merging values for key testValue.',
                )
            }
        })
    })
    describe('multiGet', () => {
        it('retrieves multiple values correctly', async () => {
            await wrapper.setItem('testValue1', 1)
            await wrapper.setItem('testValue2', 2)
            const result = await wrapper.multiGet(['testValue1', 'testValue2'])
            expect(result).toEqual([
                ['testValue1', 1],
                ['testValue2', 2],
            ])
        })
    })
    describe('multiSet', () => {
        it('sets multiple values correctly', async () => {
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2, maxAge: 10 },
            ])

            expect(
                await wrapper.multiGet(['testValue1', 'testValue2']),
            ).toEqual([
                ['testValue1', 1],
                ['testValue2', 2],
            ])
            await new Promise((r) => setTimeout(r, 200))
            expect(
                await wrapper.multiGet(['testValue1', 'testValue2']),
            ).toEqual([
                ['testValue1', 1],
                ['testValue2', null],
            ])
        })
    })
    describe('multiRemove', () => {
        it('removed items correctly', async () => {
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2 },
            ])
            expect(
                await wrapper.multiGet(['testValue1', 'testValue2']),
            ).toEqual([
                ['testValue1', 1],
                ['testValue2', 2],
            ])
            await wrapper.multiRemove(['testValue1', 'testValue2'])
            expect(
                await wrapper.multiGet(['testValue1', 'testValue2']),
            ).toEqual([
                ['testValue1', null],
                ['testValue2', null],
            ])
        })
    })
    describe('clear', () => {
        it('clears cache correctly', async () => {
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2 },
            ])
            expect(
                await wrapper.multiGet(['testValue1', 'testValue2']),
            ).toEqual([
                ['testValue1', 1],
                ['testValue2', 2],
            ])
            const cb = jest.fn()
            await wrapper.clear(cb)
            expect(cb).toHaveBeenCalled()
            expect(
                await wrapper.multiGet(['testValue1', 'testValue2']),
            ).toEqual([
                ['testValue1', null],
                ['testValue2', null],
            ])
        })
    })
    describe('keys', () => {
        it('returns keys correctly', async () => {
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2 },
            ])
            await wrapper.instance.setItem('otherValue', 123)
            const keys = await wrapper.keys()
            expect(keys.length).toEqual(3)
            expect(keys).toEqual(['testValue1', 'testValue2', 'otherValue'])
        })
    })
    describe('records', () => {
        it('retrieves records correctly', async () => {
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2, maxAge: 150 },
            ])
            const records = await wrapper.getRecords()
            expect(records.map((record) => record.toObject())).toEqual([
                {
                    key: 'testValue1',
                    version: '1.0.0',
                    value: 1,
                    expiration: undefined,
                },
                {
                    key: 'testValue2',
                    version: '1.0.0',
                    value: 2,
                    expiration: expect.any(Number),
                },
            ])
        })
    })
})
