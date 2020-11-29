import { CacheContext } from './provider'
import { CacheWrapper } from './wrapper'
import { DEFAULTS } from './constants'
import { ValueError } from './errors'
import { useContext } from 'react'

export function useCache({
    storeName = DEFAULTS.STORE_NAME,
}: { name?: string; storeName?: string } = {}): CacheWrapper {
    const context = useContext(CacheContext)
    if (!Reflect.has(context, storeName)) {
        throw new ValueError(`invalid storeName ${storeName}`)
    }
    return context[storeName]
}
