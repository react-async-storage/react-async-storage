import AsyncStorage from '@react-native-async-storage/async-storage'
import createRNAsyncStorageDriver from '../src/driver'
import localforage from 'localforage'

describe('test RN Async Storage Driver', () => {
    let testStorage: LocalForage

    beforeEach(async () => {
        testStorage = localforage.createInstance({
            name: `driverWithDefaultSerializationTest_${Date.now() * 1000}`,
        })

        const driver = await createRNAsyncStorageDriver()
        await testStorage.defineDriver(driver)
        await testStorage.setDriver(driver._driver)
        return AsyncStorage.clear()
    })

    afterEach(() => {
        //@ts-ignore
        testStorage = null
    })

    describe('setItem()/getItem()', () => {
        it('sets and gets a simple item when setItem is called with default serializer', async () => {
            const testValue = 'TEST_VALUE'
            const writtenValue = await testStorage.setItem('test', testValue)
            expect(writtenValue).toBe(testValue)

            const forageValue = await testStorage.getItem('test')
            expect(forageValue).toBe(testValue)

            const keyPrefix = testStorage.config().name
            expect(keyPrefix).toBeDefined()

            const storageValue = await AsyncStorage.getItem(
                `${keyPrefix ?? ''}/test`,
            )
            expect(storageValue).toBe(JSON.stringify(testValue))
        })

        it('sets and gets a complex item when setItem is called with default serializer', async () => {
            const complexValue = { test: true }
            const writtenValue = await testStorage.setItem('test', complexValue)
            expect(writtenValue).toEqual(complexValue)

            const forageValue = await testStorage.getItem<any>('test')
            expect(forageValue).toEqual(complexValue)

            const keyPrefix = testStorage.config().name
            expect(keyPrefix).toBeDefined()

            const storageValue = await AsyncStorage.getItem(
                `${keyPrefix ?? ''}/test`,
            )
            expect(storageValue).toBe(JSON.stringify(complexValue))
        })
    })

    describe('keys()', () => {
        it('returns an empty string, if nothing is in the store', async () => {
            const keys = await testStorage.keys()
            expect(keys).toBeDefined()
            expect(Array.isArray(keys)).toBe(true)
            expect(keys).toHaveLength(0)
        })

        it('returns all stored keys without keyPrefix', async () => {
            await testStorage.setItem('test1', 'valueOfTest1')
            await testStorage.setItem('test2', 'valueOfTest2')
            const keys = await testStorage.keys()
            expect(keys).toStrictEqual(['test1', 'test2'])
        })
    })

    describe('removeItem()', () => {
        it('removes an already existing item from storage', async () => {
            await testStorage.setItem('existingKey', 'existingValue')
            await testStorage.removeItem('existingKey')
            expect(await testStorage.getItem('existingKey')).toBeNull()
            expect(await AsyncStorage.getItem('existingKey')).toBeNull()
        })

        it('does nothing when removing a non-existing key', async () => {
            await testStorage.removeItem('nonExistingKey')
            expect(await testStorage.getItem('nonExistingKey')).toBeNull()
        })
    })

    describe('iterate()', () => {
        beforeEach(async () => {
            await testStorage.setItem('foo', 'bar')
            await testStorage.setItem('bar', 'foo')
        })

        it('iterates over all items in the store', async () => {
            const items: any[] = []
            await testStorage.iterate((value, key, iterationNumber) => {
                items.push([value, key, iterationNumber])
            })

            expect(items).toStrictEqual([
                ['bar', 'foo', 0],
                ['foo', 'bar', 1],
            ])
        })
    })

    describe('clear()', () => {
        beforeEach(async () => {
            await testStorage.setItem('foo', 'bar')
            await testStorage.setItem('bar', 'foo')
        })

        it('empties the storage', async () => {
            await testStorage.clear()
            const allKeys = await AsyncStorage.getAllKeys()
            expect(allKeys).toHaveLength(0)
        })
    })

    describe('dropInstance()', () => {
        beforeEach(async () => {
            await testStorage.setItem('foo', 'bar')
            await testStorage.setItem('bar', 'foo')
        })

        it('empties the storage', async () => {
            await testStorage.dropInstance()
            const allKeys = await AsyncStorage.getAllKeys()
            expect(allKeys).toHaveLength(0)
        })
    })
})
