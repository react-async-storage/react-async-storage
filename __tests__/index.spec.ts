/* eslint-disable no-global-assign */
/* eslint-disable no-delete-var */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/no-try-expect */
import CacheWrapper from '../src'

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
                    expect(error).toBe(
                        '<R-Cache> config() must be called before interacting with the cache',
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
        it('raises an error when config() is called twice', async () => {
            const cache = new CacheWrapper()
            await cache.config()
            try {
                await cache.config()
            } catch (error) {
                expect(error).toBe(
                    '<R-Cache> config() must be called only once',
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
                    expect(error).toBe('VALUE_ERROR')
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
    })
})
