import {
    CacheRecord,
    CacheWrapper,
    ValueError,
    cacheFactory,
    createCacheInstance,
    dropCacheInstance,
    getCache,
} from '../src'
import { ConfigError } from '../src/errors'
import localForage from 'localforage'

describe('createCacheInstance tests', () => {
    let wrapper: CacheWrapper
    let dropInstanceAfterTest: boolean
    beforeEach(() => {
        dropInstanceAfterTest = true
    })
    afterEach(async () => {
        if (dropInstanceAfterTest) {
            await dropCacheInstance()
        }
        //@ts-ignore
        wrapper = null
    })
    it('sets default name correcty', async () => {
        wrapper = await createCacheInstance()
        //@ts-ignore
        expect(wrapper.instance._config.name).toEqual('RCache')
    })
    it('sets default storeName correcty', async () => {
        wrapper = await createCacheInstance()
        expect(wrapper.storeName).toEqual('defaultCache')
    })
    it('sets custom storeName correcty', async () => {
        dropInstanceAfterTest = false
        wrapper = await createCacheInstance({ storeName: 'customName' })
        //@ts-ignore
        expect(wrapper.instance._config.storeName).toEqual('customName')
        await dropCacheInstance('customName')
    })
    it('sets default version value correcty', async () => {
        wrapper = await createCacheInstance()
        expect(wrapper.version).toBe('1.0.0')
    })
    it('sets custom version value correcty', async () => {
        wrapper = await createCacheInstance({ version: '2.0.0' })
        expect(wrapper.version).toBe('2.0.0')
    })
    it('sets default allowStale value correcty', async () => {
        wrapper = await createCacheInstance()
        expect(wrapper.allowStale).toBeFalsy()
    })
    it('sets custom allowStale value correcty', async () => {
        wrapper = await createCacheInstance({ allowStale: true })
        expect(wrapper.allowStale).toBeTruthy()
    })
    it('sets default preferCache value correcty', async () => {
        wrapper = await createCacheInstance()
        expect(wrapper.preferCache).toBeTruthy()
    })
    it('sets custom preferCache value correcty', async () => {
        wrapper = await createCacheInstance({ preferCache: false })
        expect(wrapper.allowStale).toBeFalsy()
    })
    describe('driver handling tests', () => {
        let productGetter: jest.SpyInstance

        beforeEach(() => {
            productGetter = jest.spyOn(window.navigator, 'product', 'get')
        })
        afterEach(() => {
            productGetter.mockReset()
        })
        it('sets driver correctly for web', async () => {
            productGetter.mockReturnValue('Gecko')
            wrapper = await createCacheInstance()
            //@ts-ignore
            expect(localForage._driver).toBe('localStorageWrapper')
            //@ts-ignore
            expect(wrapper.instance._driver).toBe('localStorageWrapper')
        })
        it('sets driver correctly for RN', async () => {
            productGetter.mockReturnValue('ReactNative')
            wrapper = await createCacheInstance()
            //@ts-ignore
            expect(localForage._driver).toBe(
                'rnAsyncStorageWrapper-withDefaultSerializer',
            )
            //@ts-ignore
            expect(wrapper.instance._driver).toBe(
                'rnAsyncStorageWrapper-withDefaultSerializer',
            )
        })
    })

    describe('data pruning tests', () => {
        it('prunes expired records correctly', async () => {
            wrapper = await createCacheInstance()
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2, maxAge: 10 },
                { key: 'testValue3', value: null },
            ])
            let records = await wrapper.getRecords()
            expect(records.length).toEqual(3)
            expect(records.map((record) => record.toObject())).toEqual([
                {
                    expiration: undefined,
                    key: 'testValue1',
                    value: 1,
                    version: '1.0.0',
                },
                {
                    expiration: expect.any(Number),
                    key: 'testValue2',
                    value: 2,
                    version: '1.0.0',
                },
                {
                    expiration: undefined,
                    key: 'testValue3',
                    value: null,
                    version: '1.0.0',
                },
            ])
            await new Promise((r) => setTimeout(r, 200))
            await createCacheInstance()
            records = await wrapper.getRecords()
            expect(records.map((record) => record.toObject())).toEqual([
                {
                    expiration: undefined,
                    key: 'testValue1',
                    value: 1,
                    version: '1.0.0',
                },
                {
                    expiration: undefined,
                    key: 'testValue3',
                    value: null,
                    version: '1.0.0',
                },
            ])
        })
        it('prunes old versioned records correctly', async () => {
            const record1 = new CacheRecord('currentRecord', '1.0.0', 1)
            const record2 = new CacheRecord('oldRecord', '0.0.5', 2)
            let instance = localForage.createInstance({
                name: 'RCache',
                storeName: 'defaultCache',
            })
            await instance.setItem('currentRecord', record1.toObject())
            await instance.setItem('oldRecord', record2.toObject())
            const retrievedRecord1 = await instance.getItem('currentRecord')
            const retrievedRecord2 = await instance.getItem('oldRecord')
            //@ts-ignore
            instance = null
            expect(retrievedRecord1).toEqual(record1.toObject())
            expect(retrievedRecord2).toEqual(record2.toObject())
            wrapper = await createCacheInstance()
            const records = await wrapper.getRecords()
            expect(records.map((record) => record.toObject())).toEqual([
                {
                    expiration: undefined,
                    key: 'currentRecord',
                    value: 1,
                    version: '1.0.0',
                },
            ])
        })
    })
    describe('multiple store tests', () => {
        it('creates seperate stores correctly', async () => {
            const wrapperOne = (wrapper = await createCacheInstance())
            await wrapperOne.multiSet([
                { key: 'wrapperOneValue1', value: 1 },
                { key: 'wrapperOneValue2', value: 2 },
            ])
            const wrapperTwo = await createCacheInstance({
                storeName: 'wrapperTwo',
            })
            await wrapperTwo.multiSet([
                { key: 'wrapperTwoValue1', value: 3 },
                { key: 'wrapperTwoValue2', value: 4 },
            ])
            expect(
                (await wrapperOne.getRecords()).map((record) =>
                    record.toObject(),
                ),
            ).toEqual([
                {
                    expiration: undefined,
                    key: 'wrapperOneValue1',
                    value: 1,
                    version: '1.0.0',
                },
                {
                    expiration: undefined,
                    key: 'wrapperOneValue2',
                    value: 2,
                    version: '1.0.0',
                },
            ])
            expect(
                (await wrapperTwo.getRecords()).map((record) =>
                    record.toObject(),
                ),
            ).toEqual([
                {
                    expiration: undefined,
                    key: 'wrapperTwoValue1',
                    value: 3,
                    version: '1.0.0',
                },
                {
                    expiration: undefined,
                    key: 'wrapperTwoValue2',
                    value: 4,
                    version: '1.0.0',
                },
            ])
        })
        it('clears data correctly', async () => {
            const wrapperOne = (wrapper = await createCacheInstance())
            await wrapperOne.multiSet([
                { key: 'wrapperOneValue1', value: 1 },
                { key: 'wrapperOneValue2', value: 2 },
            ])
            const wrapperTwo = await createCacheInstance({
                storeName: 'wrapperTwo',
            })
            await wrapperTwo.multiSet([
                { key: 'wrapperTwoValue1', value: 3 },
                { key: 'wrapperTwoValue2', value: 4 },
            ])
            await wrapperOne.clear()
            expect(
                (await wrapperOne.getRecords()).map((record) =>
                    record.toObject(),
                ),
            ).toEqual([])
            expect(
                (await wrapperTwo.getRecords()).map((record) =>
                    record.toObject(),
                ),
            ).toEqual([
                {
                    expiration: undefined,
                    key: 'wrapperTwoValue1',
                    value: 3,
                    version: '1.0.0',
                },
                {
                    expiration: undefined,
                    key: 'wrapperTwoValue2',
                    value: 4,
                    version: '1.0.0',
                },
            ])
        })
    })
})

describe('getCache tests', () => {
    it('retrieves cacheRecords correctly', async () => {
        await cacheFactory([
            { storeName: 'store1' },
            { storeName: 'store2' },
            { storeName: 'store3' },
        ])
        const store1 = getCache('store1')
        const store2 = getCache('store2')
        const store3 = getCache('store3')
        expect(store1).toBeInstanceOf(CacheWrapper)
        expect(store2).toBeInstanceOf(CacheWrapper)
        expect(store3).toBeInstanceOf(CacheWrapper)
        await dropCacheInstance('store1')
        await dropCacheInstance('store2')
        await dropCacheInstance('store3')
    })
    it('throws ValueError for invalid storename', async () => {
        await cacheFactory([{ storeName: 'store1' }])
        try {
            getCache('store1')
        } catch (error) {
            expect(error).toBeInstanceOf(ValueError)
        }
    })
    it('throws ConfigError when no init has take place', () => {
        try {
            getCache('store1')
        } catch (error) {
            expect(error).toBeInstanceOf(ConfigError)
        }
    })
})
