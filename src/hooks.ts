import { CacheContext } from './provider'
import { CacheWrapper } from './wrapper'
import { DEFAULTS } from './constants'
import { ValueError } from './errors'
import { useContext } from 'react'

export function useStorage(
    storeNames: string | string[] = [DEFAULTS.STORE_NAME],
): CacheWrapper[] {
    const context = useContext(CacheContext)
    const storesArr = Array.isArray(storeNames) ? storeNames : [storeNames]
    for (const name of storesArr) {
        if (!Reflect.has(context, name)) {
            throw new ValueError(`invalid storeName ${name}`)
        }
    }
    return storesArr.map((name: string) => context[name])
}
