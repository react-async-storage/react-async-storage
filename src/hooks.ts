import { CacheContext } from './provider'
import { CacheWrapper } from './wrapper'
import { DEFAULTS } from './constants'
import { ValueError } from './errors'
import { useContext } from 'react'

export function useCache(
    stores: string | string[] = [DEFAULTS.STORE_NAME],
): CacheWrapper[] {
    const context = useContext(CacheContext)
    const storesArr = Array.isArray(stores) ? stores : [stores]
    storesArr.forEach((name: string) => {
        if (!Reflect.has(context, name)) {
            throw new ValueError(`invalid storeName ${name}`)
        }
    })
    return storesArr.map((name: string) => context[name])
}
