import { CacheWrapper } from '../src/wrapper'
import cacheFactory from '../src'
import localForage from 'localforage'

describe('cacheFactory tests', () => {
    let wrapper: CacheWrapper
    afterEach(async () => {
        await wrapper.clear()
        //@ts-ignore
        wrapper = null
    })
    it('sets default name correcty', async () => {
        wrapper = await cacheFactory()
        expect(wrapper.name).toEqual('RCache')
    })
    it('sets custom name correcty', async () => {
        wrapper = await cacheFactory({ name: 'customName' })
        expect(wrapper.name).toEqual('customName')
    })
    it('sets default storeName correcty', async () => {
        wrapper = await cacheFactory()
        //@ts-ignore
        expect(wrapper.instance._config.storeName).toEqual('defaultCache')
    })
    it('sets custom storeName correcty', async () => {
        wrapper = await cacheFactory({ storeName: 'customName' })
        //@ts-ignore
        expect(wrapper.instance._config.storeName).toEqual('customName')
    })
    it('sets default version value correcty', async () => {
        wrapper = await cacheFactory()
        expect(wrapper.version).toBe('1.0.0')
    })
    it('sets custom version value correcty', async () => {
        wrapper = await cacheFactory({ version: '2.0.0' })
        expect(wrapper.version).toBe('2.0.0')
    })
    it('sets default allowStale value correcty', async () => {
        wrapper = await cacheFactory()
        expect(wrapper.allowStale).toBeFalsy()
    })
    it('sets custom allowStale value correcty', async () => {
        wrapper = await cacheFactory({ allowStale: true })
        expect(wrapper.allowStale).toBeTruthy()
    })
    it('sets default preferCache value correcty', async () => {
        wrapper = await cacheFactory()
        expect(wrapper.preferCache).toBeTruthy()
    })
    it('sets custom preferCache value correcty', async () => {
        wrapper = await cacheFactory({ preferCache: false })
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
            wrapper = await cacheFactory()
            //@ts-ignore
            expect(localForage._driver).toBe('localStorageWrapper')
            //@ts-ignore
            expect(wrapper.instance._driver).toBe('localStorageWrapper')
        })
        it('sets driver correctly for RN', async () => {
            productGetter.mockReturnValue('ReactNative')
            wrapper = await cacheFactory()
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
            wrapper = await cacheFactory()
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
            await cacheFactory()
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
            wrapper = await cacheFactory()
            await wrapper.multiSet([
                { key: 'testValue1', value: 1 },
                { key: 'testValue2', value: 2 },
            ])
            await wrapper.updateRecord('testValue2', {
                version: '0.5.0',
            })
            let records = await wrapper.getRecords()
            expect(records.map((record) => record.toObject())).toEqual([
                {
                    expiration: undefined,
                    key: 'testValue1',
                    value: 1,
                    version: '1.0.0',
                },
                {
                    expiration: undefined,
                    key: 'testValue2',
                    value: 2,
                    version: '0.5.0',
                },
            ])
            await cacheFactory()
            records = await wrapper.getRecords()
            expect(records.map((record) => record.toObject())).toEqual([
                {
                    expiration: undefined,
                    key: 'testValue1',
                    value: 1,
                    version: '1.0.0',
                },
            ])
        })
    })
    describe('multiple store tests', () => {
        it('creates seperate stores correctly', async () => {
            const wrapperOne = (wrapper = await cacheFactory())
            await wrapperOne.multiSet([
                { key: 'wrapperOneValue1', value: 1 },
                { key: 'wrapperOneValue2', value: 2 },
            ])
            const wrapperTwo = await cacheFactory({ storeName: 'wrapperTwo' })
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
            const wrapperOne = (wrapper = await cacheFactory())
            await wrapperOne.multiSet([
                { key: 'wrapperOneValue1', value: 1 },
                { key: 'wrapperOneValue2', value: 2 },
            ])
            const wrapperTwo = await cacheFactory({ storeName: 'wrapperTwo' })
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
