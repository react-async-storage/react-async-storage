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
                        '<rn-cache-wrapper> cacheInit must be called before interacting with the cache',
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
    })
})
