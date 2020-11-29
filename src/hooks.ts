import { CacheContext, DEFAULTS } from '.'
import { CacheWrapper } from './wrapper'
import { useContext } from 'react'

export function useCache({
    name = DEFAULTS.NAME,
    storeName = DEFAULTS.STORE_NAME,
}: { name?: string; storeName?: string } = {}): CacheWrapper {
    const context = useContext(CacheContext)
    if (!context[name]?.[storeName]) {
        throw new Error('')
    }
    return context[name][storeName]
}
