import {
    DEFAULTS,
    StorageRecord,
    StorageWrapper,
    ValueError,
    createCacheStorage,
    dropCacheStorage,
    getStorage,
    storageFactory,
} from '../src'
import localForage from 'localforage'

describe('createCacheStorage tests', () => {
    let wrapper: StorageWrapper
    let dropInstanceAfterTest: boolean
    beforeEach(() => {
        dropInstanceAfterTest = true
    })
    afterEach(async () => {
        if (dropInstanceAfterTest) {
            await dropCacheStorage()
        }
        //@ts-ignore
        wrapper = null
    })
    it('sets default name correcty', async () => {
        wrapper = await createCacheStorage()
        //@ts-ignore
        expect(wrapper.instance._config.name).toEqual('ReactAsyncStorage')
    })
    it('sets default storeName correcty', async () => {
        wrapper = await createCacheStorage()
        expect(wrapper.storeName).toEqual('defaultStore')
    })
    it('sets custom storeName correcty', async () => {
        dropInstanceAfterTest = false
        wrapper = await createCacheStorage({ storeName: 'customName' })
        //@ts-ignore
        expect(wrapper.instance._config.storeName).toEqual('customName')
        await dropCacheStorage('customName')
    })
    it('sets default version value correcty', async () => {
        wrapper = await createCacheStorage()
        expect(wrapper.version).toBe('1.0.0')
    })
    it('sets custom version value correcty', async () => {
        wrapper = await createCacheStorage({ version: '2.0.0' })
        expect(wrapper.version).toBe('2.0.0')
    })
    it('sets default allowStale value correcty', async () => {
        wrapper = await createCacheStorage()
        expect(wrapper.allowStale).toBeFalsy()
    })
    it('sets custom allowStale value correcty', async () => {
        wrapper = await createCacheStorage({ allowStale: true })
        expect(wrapper.allowStale).toBeTruthy()
    })
    it('sets default preferCache value correcty', async () => {
        wrapper = await createCacheStorage()
        expect(wrapper.preferCache).toBeTruthy()
    })
    it('sets custom preferCache value correcty', async () => {
        wrapper = await createCacheStorage({ preferCache: false })
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
            wrapper = await createCacheStorage()
            //@ts-ignore
            expect(localForage._driver).toBe('localStorageWrapper')
            //@ts-ignore
            expect(wrapper.instance._driver).toBe('localStorageWrapper')
        })
        it('sets driver correctly for RN', async () => {
            productGetter.mockReturnValue('ReactNative')
            wrapper = await createCacheStorage()
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
            wrapper = await createCacheStorage()
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2, maxAge: 10 },
                { key: 'testValue3', value: null },
            ])
            let records = await wrapper.getRecords()
            expect(records).toHaveLength(3)
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
            await createCacheStorage()
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
            const record1 = new StorageRecord('currentRecord', '1.0.0', 1)
            const record2 = new StorageRecord('oldRecord', '0.0.5', 2)
            let instance = localForage.createInstance({
                name: 'ReactAsyncStorage',
                storeName: 'defaultStore',
            })
            await instance.setItem('currentRecord', record1.toObject())
            await instance.setItem('oldRecord', record2.toObject())
            const retrievedRecord1 = await instance.getItem('currentRecord')
            const retrievedRecord2 = await instance.getItem('oldRecord')
            //@ts-ignore
            instance = null
            expect(retrievedRecord1).toEqual(record1.toObject())
            expect(retrievedRecord2).toEqual(record2.toObject())
            wrapper = await createCacheStorage()
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
            const wrapperOne = (wrapper = await createCacheStorage())
            await wrapperOne.multiSet([
                { key: 'wrapperOneValue1', value: 1 },
                { key: 'wrapperOneValue2', value: 2 },
            ])
            const wrapperTwo = await createCacheStorage({
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
            const wrapperOne = (wrapper = await createCacheStorage())
            await wrapperOne.multiSet([
                { key: 'wrapperOneValue1', value: 1 },
                { key: 'wrapperOneValue2', value: 2 },
            ])
            const wrapperTwo = await createCacheStorage({
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

describe('dropCacheStorage tests', () => {
    it('throws error on invalid storeName', async () => {
        try {
            await storageFactory([
                { storeName: 'store1' },
                { storeName: 'store2' },
                { storeName: 'store3' },
            ])
            await dropCacheStorage('xzy')
        } catch (error) {
            expect(error).toBeInstanceOf(ValueError)
            expect(error.message).toBe('<R-Cache> invalid storeName xzy')
        }
    })
})

describe('getStorage tests', () => {
    it('retrieves StorageRecords correctly', async () => {
        await storageFactory([
            { storeName: 'store1' },
            { storeName: 'store2' },
            { storeName: 'store3' },
        ])
        const store1 = getStorage('store1')
        const store2 = getStorage('store2')
        const store3 = getStorage('store3')
        expect(store1).toBeInstanceOf(StorageWrapper)
        expect(store2).toBeInstanceOf(StorageWrapper)
        expect(store3).toBeInstanceOf(StorageWrapper)
        await dropCacheStorage('store1')
        await dropCacheStorage('store2')
        await dropCacheStorage('store3')
    })
    it('retireves default cache namespace correctly', async () => {
        await createCacheStorage()
        const store = getStorage()
        expect(store).toBeInstanceOf(StorageWrapper)
        expect(store.storeName).toBe(DEFAULTS.STORE_NAME)
    })
    it('throws ValueError for invalid storename', async () => {
        await storageFactory([{ storeName: 'store1' }])
        try {
            getStorage('xyz')
        } catch (error) {
            expect(error).toBeInstanceOf(ValueError)
            expect(error.message).toBe(`<R-Cache> invalid storeName xyz`)
        }
    })
})
