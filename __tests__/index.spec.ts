/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-global-assign */
/* eslint-disable no-delete-var */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/no-try-expect */
import CacheWrapper from '../src'
import localForage from 'localforage'
import merge from 'lodash.merge'

describe('CacheWrapper tests', () => {
    describe('test constructor', () => {
        it('sets name', () => {
            let cache = new CacheWrapper()
            expect(cache.name).toBe('ReactCacheWrapper')
            cache = new CacheWrapper({ name: 'TestCacheWrapper' })
            expect(cache.name).toBe('TestCacheWrapper')
        })
        it('sets version', () => {
            let cache = new CacheWrapper()
            expect(cache.version).toEqual(1.0)
            cache = new CacheWrapper({ version: 1.1 })
            expect(cache.version).toEqual(1.1)
        })
    })
    describe('test error handling', () => {
        let cache: CacheWrapper
        beforeEach(() => {
            cache = new CacheWrapper({ name: 'TestCacheWrapper' })
        })
        for (const methodName of Object.getOwnPropertyNames(
            CacheWrapper.prototype,
        ).filter(
            (key) =>
                key !== 'constructor' && key !== 'config' && !key.includes('_'),
        )) {
            it(`${methodName} throws error if config() is not called before calling it`, async () => {
                try {
                    // @ts-ignore
                    await cache[methodName]()
                } catch (error) {
                    expect(error?.message).toBe(
                        '<R-Cache> config must be called before interacting with the cache',
                    )
                }
            })
        }
    })
    describe('test config()', () => {
        let productGetter: jest.SpyInstance

        beforeEach(() => {
            productGetter = jest.spyOn(window.navigator, 'product', 'get')
        })

        it('sets driver correctly for web', async () => {
            productGetter.mockReturnValue('Gecko')
            const cache = new CacheWrapper()
            await cache.config()
            //@ts-ignore
            expect(cache.localForage._driver).toBe('localStorageWrapper')
        })
        it('sets driver correctly for RN', async () => {
            productGetter.mockReturnValue('ReactNative')
            const cache = new CacheWrapper()
            await cache.config()
            //@ts-ignore
            expect(cache.localForage._driver).toBe(
                'rnAsyncStorageWrapper-withDefaultSerializer',
            )
        })
        it('throws an error when config() is called twice', async () => {
            const cache = new CacheWrapper()
            await cache.config()
            try {
                await cache.config()
            } catch (error) {
                expect(error.message).toBe(
                    '<R-Cache> config must be called only once',
                )
            }
        })
        it('throws an error when options.driver is present in RN', async () => {
            const cache = new CacheWrapper({ driver: localForage.INDEXEDDB })
            try {
                await cache.config()
            } catch (error) {
                expect(error.message).toBe(
                    '<R-Cache> do not pass driver in ReactNative',
                )
            }
        })
    })
    describe('cache methods', () => {
        const testValue = 'testValue 12345'
        let cache: CacheWrapper
        beforeEach(async () => {
            cache = new CacheWrapper({ name: 'TestCacheWrapper' })
            await cache.config()
        })
        afterEach(async () => {
            await cache.clear()
        })
        describe('getItem', () => {
            it('retrieves value without expiration correctly', async () => {
                await cache.setItem('testValue', testValue)
                expect(await cache.getItem('testValue')).toBe(testValue)
            })
            it('retrieves value with expiration correctly', async () => {
                await cache.setItem('testValue', testValue, 10)
                expect(cache.hasItem('testValue')).toBeTruthy()
                await new Promise((r) => setTimeout(r, 200))
                expect(cache.hasItem('testValue')).toBeTruthy()
                expect(await cache.getItem('testValue')).toBeNull()
                expect(cache.hasItem('testValue')).toBeFalsy()
            })
            it('throws error on no value when the option set to true', async () => {
                expect(await cache.getItem('testValue')).toBeNull()
                try {
                    await cache.getItem('testValue', null, true)
                } catch (error) {
                    expect(error.message).toBe('VALUE_ERROR')
                }
            })
            it('calls fallback when provided', async () => {
                const fallback = 'fallback'
                const result = await cache.getItem('testValue', fallback)
                expect(result).toBe(fallback)
            })
            it('does not throw error when fallback is provided', async () => {
                const fallback = 'fallback'
                const result = await cache.getItem('testValue', fallback, true)
                expect(result).toBe(fallback)
            })
        })
        describe('setItem', () => {
            it('sets items correctly without maxAge', async () => {
                expect(await cache.getItem('testValue')).toBeNull()
                await cache.setItem('testValue', testValue)
                expect(await cache.getItem('testValue')).toBe(testValue)
            })
            it('sets items correctly with maxAge', async () => {
                expect(await cache.getItem('testValue')).toBeNull()
                await cache.setItem('testValue', testValue, 10)
                expect(await cache.getItem('testValue')).toBe(testValue)
                await new Promise((r) => setTimeout(r, 200))
                expect(await cache.getItem('testValue')).toBeNull()
            })
        })
        describe('hasItem', () => {
            it('returns true/false correctly', async () => {
                expect(cache.hasItem('testValue')).toBeFalsy()
                await cache.setItem('testValue', testValue)
                expect(cache.hasItem('testValue')).toBeTruthy()
            })
        })
        describe('removeItem', () => {
            it('removes value correctly', async () => {
                await cache.setItem('testValue', testValue)
                expect(cache.hasItem('testValue')).toBeTruthy()
                expect(await cache.getItem('testValue')).toBe(testValue)
                await cache.removeItem('testValue')
                expect(cache.hasItem('testValue')).toBeFalsy()
                expect(await cache.getItem('testValue')).toBeNull()
            })
        })
        describe('mergeItem', () => {
            const value1 = { key1: 'value1' }
            const value2 = { key2: 'value2', key3: [1, 2, 3] }
            const merged = merge(value1, value2)
            it('merges stored values correctly', async () => {
                await cache.setItem('testValue', value1)
                expect(await cache.getItem('testValue')).toEqual(value1)
                const mergedResult = await cache.mergeItem('testValue', value2)
                expect(mergedResult).toEqual(merged)
                expect(await cache.getItem('testValue')).toEqual(merged)
            })
            it('throws an error when merge value is not an object', async () => {
                await cache.setItem('testValue', value1)
                try {
                    await cache.mergeItem('testValue', 1)
                } catch (error) {
                    expect(error.message).toBe(
                        '<R-Cache> merge value must be of typeof object',
                    )
                }
            })
            it('throws an error when merge target is null', async () => {
                try {
                    await cache.mergeItem('testValue', value2)
                } catch (error) {
                    expect(error.message).toBe('CACHE_ERROR')
                }
            })
            it('throws an error when merge target is not an object', async () => {
                await cache.setItem('testValue', 1)
                try {
                    await cache.mergeItem('testValue', value2)
                } catch (error) {
                    expect(error.message).toBe('CACHE_ERROR')
                }
            })
        })
        describe('multiGetItem', () => {
            it('retrieves multiple values correctly', async () => {
                await cache.setItem('testValue1', 1)
                await cache.setItem('testValue2', 2)
                const result = await cache.multiGetItem([
                    'testValue1',
                    'testValue2',
                ])
                expect(result).toEqual([
                    ['testValue1', 1],
                    ['testValue2', 2],
                ])
            })
        })
        describe('multiSetItem', () => {
            it('sets multiple values correctly', async () => {
                await cache.multiSetItem([
                    { key: 'testValue1', value: 1 },
                    { key: 'testValue2', value: 2, maxAge: 10 },
                ])

                expect(
                    await cache.multiGetItem(['testValue1', 'testValue2']),
                ).toEqual([
                    ['testValue1', 1],
                    ['testValue2', 2],
                ])
                await new Promise((r) => setTimeout(r, 200))
                expect(
                    await cache.multiGetItem(['testValue1', 'testValue2']),
                ).toEqual([
                    ['testValue1', 1],
                    ['testValue2', null],
                ])
            })
        })
        describe('multiRemoveItem', () => {
            it('removed items correctly', async () => {
                await cache.multiSetItem([
                    { key: 'testValue1', value: 1 },
                    { key: 'testValue2', value: 2 },
                ])
                expect(
                    await cache.multiGetItem(['testValue1', 'testValue2']),
                ).toEqual([
                    ['testValue1', 1],
                    ['testValue2', 2],
                ])
                await cache.multiRemoveItem(['testValue1', 'testValue2'])
                expect(
                    await cache.multiGetItem(['testValue1', 'testValue2']),
                ).toEqual([
                    ['testValue1', null],
                    ['testValue2', null],
                ])
            })
        })
    })
})
