import cacheFactory from './src'

export const myStore = (async () =>
    await cacheFactory({
        storeName: 'myStore',
        version: '1.0.1',
    }))()

export const myOtherStore = (async () =>
    await cacheFactory({
        storeName: 'myOtherStore',
        version: '2.0.0',
    }))()
