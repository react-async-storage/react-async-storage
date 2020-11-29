import { CacheProviderProps } from './types'
import { CacheWrapper } from './wrapper'
import { cacheFactory } from './core'
import React, {
    PropsWithChildren,
    createContext,
    useEffect,
    useState,
} from 'react'

export const CacheContext = createContext<Record<string, CacheWrapper>>({})

export function CacheProvider({
    onReady,
    options,
    children,
}: PropsWithChildren<CacheProviderProps>): React.ReactElement {
    const [isLoaded, setIsLoaded] = useState(false)
    const [wrappers, setWrappers] = useState<Record<string, CacheWrapper>>({})
    useEffect(() => {
        ;(async () => {
            const wrappers = await cacheFactory(options)
            setWrappers(wrappers)
            setIsLoaded(true)
        })()
    }, [options])

    useEffect(() => {
        if (isLoaded && onReady) {
            onReady()
        }
    }, [isLoaded])

    return (
        <CacheContext.Provider value={wrappers}>
            {children}
        </CacheContext.Provider>
    )
}
