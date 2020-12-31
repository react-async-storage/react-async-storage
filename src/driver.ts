/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/**
 the code in this file was originally forked from https://github.com/aveq-research/localforage-asyncstorage-driver/blob/master/src/main.js
 it was re-written into typescript and modified for the requirements of this package.
 */

import { AsyncStorageStatic } from '@react-native-async-storage/async-storage'

interface DBInfo extends LocalForageOptions {
    serializer?: LocalForageSerializer
    keyPrefix: string
}

type ILocalForage = LocalForage & {
    _defaultConfig: LocalForageOptions
    _dbInfo: DBInfo
}

function getKeyPrefix(
    options: LocalForageOptions,
    defaultConfig: LocalForageOptions,
) {
    let keyPrefix = `${options?.name ?? ''}/`
    if (options.storeName && options.storeName !== defaultConfig.storeName) {
        keyPrefix += `${options.storeName}/`
    }

    return keyPrefix
}

export default async function createRNAsyncStorageDriver(): Promise<
    {
        _driver: string
    } & LocalForageDriver
> {
    const { default: AsyncStorage } = (await import(
        '@react-native-async-storage/async-storage'
    )) as { default: AsyncStorageStatic }

    async function _iterate(
        this: ILocalForage,
        dbInfo: DBInfo,
        keys: string[],
        iterator: CallableFunction,
        iterationNumber: number,
    ): Promise<any> {
        const serializer = await this.getSerializer()
        const key = keys.shift()
        if (key === undefined) {
            return
        }

        const keyPrefix = dbInfo.keyPrefix
        if (key.indexOf(keyPrefix) === 0) {
            const serializedValue = await AsyncStorage.getItem(key)
            const value =
                serializedValue !== null
                    ? serializer.deserialize(serializedValue)
                    : null

            const itVal = iterator(
                value,
                key.slice(keyPrefix.length),
                iterationNumber++,
            )

            if (itVal !== undefined) {
                return itVal
            }
        }

        return _iterate.call(this, dbInfo, keys, iterator, iterationNumber)
    }

    return {
        _driver: 'RNAsyncStorageLocalForageDriver',
        _support: async function () {
            return new Promise((resolve) =>
                resolve(AsyncStorage && Reflect.has(AsyncStorage, 'setItem')),
            )
        },
        _initStorage: async function (
            this: ILocalForage,
            options: LocalForageOptions = {},
        ) {
            this._dbInfo = {
                ...options,
                keyPrefix: getKeyPrefix(options, this._defaultConfig),
            }
            return Promise.resolve()
        },
        iterate: async function (
            this: ILocalForage,
            iterator: CallableFunction,
        ): Promise<any> {
            await this.ready()
            const allKeys = await AsyncStorage.getAllKeys()
            return _iterate.call(this, this._dbInfo, allKeys, iterator, 0)
        },
        getItem: async function (
            this: ILocalForage,
            key: string,
        ): Promise<any | null> {
            await this.ready()
            const serializer = await this.getSerializer()
            const item = await AsyncStorage.getItem(
                `${this._dbInfo.keyPrefix}${key}`,
            )
            return item ? serializer.deserialize(item) : null
        },
        setItem: async function (
            this: ILocalForage,
            key: string,
            value: any,
        ): Promise<any> {
            await this.ready()
            const serializer = await this.getSerializer()
            if (value === undefined) {
                value = null
            }

            const originalValue = value
            const dbInfo = this._dbInfo

            async function writeToStorage(valueToWrite: any) {
                await AsyncStorage.setItem(
                    `${dbInfo.keyPrefix}${key}`,
                    valueToWrite,
                )
                return originalValue
            }
            return new Promise((resolve, reject) => {
                serializer.serialize(value, (serializedValue, error) => {
                    if (error) {
                        reject(error)
                        return
                    }
                    writeToStorage(serializedValue).then(resolve).catch(reject)
                })
            })
        },
        removeItem: async function (
            this: ILocalForage,
            key: string,
        ): Promise<void> {
            key = String(key)
            await this.ready()
            await AsyncStorage.removeItem(`${this._dbInfo.keyPrefix}${key}`)
        },
        clear: async function (this: ILocalForage): Promise<void> {
            await this.ready()
            const keyPrefix = this._dbInfo.keyPrefix
            const keysToDelete = []
            const allKeys = await AsyncStorage.getAllKeys()

            for (const key of allKeys) {
                if (key.indexOf(keyPrefix) === 0) {
                    keysToDelete.push(key)
                }
            }

            await AsyncStorage.multiRemove(keysToDelete)
        },
        length: async function (this: ILocalForage): Promise<number> {
            const keys = await this.keys()
            return keys.length
        },
        key: async function (this: ILocalForage, n: number): Promise<string> {
            await this.ready()
            const dbInfo = this._dbInfo
            const allKeys = await AsyncStorage.getAllKeys()
            const key = allKeys[n]
            return key ? key.slice(dbInfo.keyPrefix.length) : ''
        },
        keys: async function (this: ILocalForage): Promise<string[]> {
            await this.ready()

            const dbInfo = this._dbInfo
            const allKeys = await AsyncStorage.getAllKeys()
            const driverKeys = []

            for (const key of allKeys) {
                if (key.indexOf(dbInfo.keyPrefix) === 0) {
                    driverKeys.push(key.slice(dbInfo.keyPrefix.length))
                }
            }

            return driverKeys
        },
        dropInstance: async function (
            this: ILocalForage,
            options: LocalForageOptions = {},
        ): Promise<void> {
            const currentConfig = this.config()
            options.name = options.name ?? currentConfig.name
            options.storeName = options.storeName ?? currentConfig.storeName

            if (options.name === undefined) {
                throw new Error('Invalid arguments')
            }

            const keyPrefix = getKeyPrefix(options, this._defaultConfig)
            const keys = await this.keys()
            const keysToDelete = keys.map((k) => `${keyPrefix}${k}`)
            return AsyncStorage.multiRemove(keysToDelete)
        },
    }
}
