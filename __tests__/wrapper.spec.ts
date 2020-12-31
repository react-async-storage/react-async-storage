import {
    StorageError,
    StorageRecord,
    StorageWrapper,
    createCacheStorage,
    dropCacheStorage,
} from '../src'
import merge from 'lodash.merge'

describe('StorageWrapper tests', () => {
    let wrapper: StorageWrapper
    beforeEach(async () => {
        wrapper = await createCacheStorage()
    })
    afterEach(async () => {
        await dropCacheStorage()
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
                expect(error).toBeInstanceOf(StorageError)
                expect(error.message).toBe(
                    `<R-Cache> null value returned for key testValue`,
                )
            }
        })
        it('returns null when allowNull is true and no value is returned', async () => {
            const record = await wrapper.getRecord('testValue')
            expect(record).toBeNull()
        })
        it('throws an error when stale value is returned and allowNull is false', async () => {
            try {
                const record = new StorageRecord(
                    'testValue',
                    '1.0.0',
                    'someValue',
                )
                record.expiration = Date.now() - 100
                await wrapper.instance.setItem('testValue', record.toObject())
                await wrapper.getRecord('testValue', { allowNull: false })
            } catch (error) {
                expect(error).toBeInstanceOf(StorageError)
                expect(error.message).toBe(
                    `<R-Cache> stale value return for key testValue: to resolve this error allowNull when calling getRecord`,
                )
            }
        })
        it('returns null when allowNull is true and stale value is returned', async () => {
            const record = new StorageRecord('testValue', '1.0.0', 'someValue')
            record.expiration = Date.now() - 100
            await wrapper.instance.setItem('testValue', record.toObject())
            const retrievedRecord = await wrapper.getRecord('testValue')
            expect(retrievedRecord).toBeNull()
        })
    })
    describe('updateRecord', () => {
        it('updates record value when passed a regular value', async () => {
            await wrapper.setItem('testValue', testValue)
            await wrapper.updateRecord('testValue', { value: '123' })
            const record = await wrapper.getRecord('testValue')
            expect(record?.value).toBe('123')
        })
        it('updates record value when passed a function', async () => {
            await wrapper.setItem('testValue', testValue)
            const setter = jest.fn((val: string) => val + '123')
            await wrapper.updateRecord('testValue', { value: setter })
            expect(setter).toHaveBeenCalled()
            const record = await wrapper.getRecord('testValue')
            expect(record?.value).toBe(testValue + '123')
        })
        it('updates expiration when passed number', async () => {
            await wrapper.setItem('testValue', testValue)
            await wrapper.updateRecord('testValue', { maxAge: 1 })
            const record = await wrapper.getRecord('testValue')
            expect(record?.expiration).toBeTruthy()
        })
        it('updates expiration when passed array', async () => {
            await wrapper.setItem('testValue', testValue)
            await wrapper.updateRecord('testValue', { maxAge: [1, 'day'] })
            const record = await wrapper.getRecord('testValue')
            expect(record?.expiration).toBeTruthy()
        })
        it('updates version correctly', async () => {
            await wrapper.setItem('testValue', testValue)
            await wrapper.updateRecord('testValue', { version: '2.0.0' })
            const record = await wrapper.getRecord('testValue')
            expect(record?.version).toBe('2.0.0')
        })
        it('calls callback with record when callback is passed', async () => {
            const callback = jest.fn()
            await wrapper.setItem('testValue', testValue)
            await wrapper.updateRecord('testValue', null, callback)
            const record = await wrapper.getRecord('testValue')
            expect(callback).toHaveBeenCalledWith(null, record)
        })
        it('passes error to callback when error is thrown and callback is provided', async () => {
            const callback = jest.fn()
            await wrapper.setItem('testValue', testValue)
            wrapper.instance.setItem = async () =>
                new Promise((_, reject) => reject())
            await wrapper.updateRecord('testValue', null, callback)
            expect(callback).toHaveBeenCalled()
        })
        it('throws StorageError when no callback is provided and an error occurs', async () => {
            try {
                await wrapper.setItem('testValue', testValue)
                wrapper.instance.setItem = async () =>
                    new Promise((_, reject) => reject())
                await wrapper.updateRecord('testValue', { value: '123' })
            } catch (error) {
                expect(error).toBeInstanceOf(StorageError)
                expect(error.message).toBe(
                    '<R-Cache> error writing key testValue',
                )
            }
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
        it('returns fallback when provided', async () => {
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
        it('calls callback with record when callback is passed', async () => {
            const callback = jest.fn()
            await wrapper.setItem('testValue', testValue)
            await wrapper.getItem('testValue', undefined, callback)
            expect(callback).toHaveBeenCalledWith(null, testValue)
        })
        it('passes error to callback when error is thrown and callback is provided', async () => {
            const callback = jest.fn()
            await wrapper.setItem('testValue', testValue)
            wrapper.getRecord = async () => new Promise((_, reject) => reject())
            await wrapper.getItem('testValue', undefined, callback)
            expect(callback).toHaveBeenCalled()
        })
        it('throws when no callback is provided and an error occurs', async () => {
            try {
                await wrapper.getItem('testValue', { allowNull: false })
            } catch (error) {
                expect(error).toBeInstanceOf(StorageError)
            }
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
        it('calls callback with record when callback is passed', async () => {
            const callback = jest.fn()
            await wrapper.setItem('testValue', testValue, undefined, callback)
            const record = await wrapper.getRecord('testValue')
            expect(callback).toHaveBeenCalledWith(null, record)
        })
        it('passes error to callback when error is thrown and callback is provided', async () => {
            const callback = jest.fn()
            wrapper.instance.setItem = async () =>
                new Promise((_, reject) => reject())
            await wrapper.setItem('testValue', testValue, undefined, callback)
            expect(callback).toHaveBeenCalled()
        })
        it('throws StorageError when no callback is provided and an error occurs', async () => {
            try {
                wrapper.instance.setItem = async () =>
                    new Promise((_, reject) => reject())
                await wrapper.setItem('testValue', testValue)
            } catch (error) {
                expect(error).toBeInstanceOf(StorageError)
                expect(error.message).toBe(
                    '<R-Cache> error writing key testValue',
                )
            }
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
        it('calls callback with merge result when callback is provided', async () => {
            const callback = jest.fn()
            await wrapper.setItem('testValue', value1)
            const mergedResult = await wrapper.mergeItem(
                'testValue',
                value2,
                callback,
            )
            expect(callback).toHaveBeenCalledWith(null, mergedResult)
        })
        it('calls callback with error when callback is passed', async () => {
            const callback = jest.fn()
            await wrapper.setItem('testValue', value1)
            wrapper.instance.setItem = async () =>
                new Promise((_, reject) => reject())
            await wrapper.mergeItem('testValue', value2, callback)
            expect(callback).toHaveBeenCalled()
        })
        it('throws StorageError when no callback is provided', async () => {
            await wrapper.setItem('testValue', value1)
            wrapper.instance.setItem = async () =>
                new Promise((_, reject) => reject())
            try {
                await wrapper.mergeItem('testValue', value2)
            } catch (error) {
                expect(error).toBeInstanceOf(StorageError)
                expect(error.message).toBe(
                    '<R-Cache> error merging values for key testValue',
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
    describe('multiMerge', () => {
        it('merges multiple values correctly', async () => {
            await wrapper.multiSet([
                { key: 'testValue1', value: { color: 'white' } },
                { key: 'testValue2', value: { color: 'black' } },
            ])

            expect(
                await wrapper.multiMerge([
                    { key: 'testValue1', value: { height: 10 } },
                    { key: 'testValue2', value: { height: 20 } },
                ]),
            ).toEqual([
                ['testValue1', { color: 'white', height: 10 }],
                ['testValue2', { color: 'black', height: 20 }],
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
            expect(keys).toHaveLength(3)
            expect(keys).toEqual(['testValue1', 'testValue2', 'otherValue'])
        })
    })
    describe('getRecords', () => {
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
        it('calls callback with records when callback is passed', async () => {
            const callback = jest.fn()
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2, maxAge: 150 },
            ])
            const records = await wrapper.getRecords(true, callback)
            expect(callback).toHaveBeenCalledWith(null, records)
        })
        it('calls callback with error when callback is passed', async () => {
            const callback = jest.fn()
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2, maxAge: 150 },
            ])
            wrapper.getRecord = async () => new Promise((_, reject) => reject())
            await wrapper.getRecords(true, callback)
            expect(callback).toHaveBeenCalled()
        })
        it('throws StorageError when no callback is provided', async () => {
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2, maxAge: 150 },
            ])
            wrapper.getRecord = () => {
                throw new Error('test')
            }
            try {
                await wrapper.getRecords()
            } catch (error) {
                expect(error.message).toBe('test')
            }
        })
    })
})
