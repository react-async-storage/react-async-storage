import { CacheOptions } from './types'
import { CacheWrapper } from './wrapper'
import React, {
    Context,
    MutableRefObject,
    useContext,
    useEffect,
    useState,
} from 'react'
import cacheFactory from '.'

interface CacheProviderProps {
    children: any
    cacheRef: MutableRefObject<CacheWrapper | undefined>
    onReady?: () => void
    options?: CacheOptions
}

const contexts: Record<
    string,
    Record<string, Context<CacheWrapper | undefined>>
> = {}

export function createProvider(
    name: string,
    storeName: string,
): [
    Context<CacheWrapper | undefined>,
    (props: CacheProviderProps) => React.ReactElement,
] {
    if (!contexts[name]) {
        contexts[name] = {}
    }
    if (!contexts[name][storeName]) {
        contexts[name][storeName] = React.createContext<
            CacheWrapper | undefined
        >(undefined)
    }

    const Context = contexts[name][storeName]

    function CacheProvider({
        onReady,
        children,
        cacheRef,
        options,
    }: CacheProviderProps): React.ReactElement {
        const [isLoaded, setIsLoaded] = useState(false)

        useEffect(() => {
            ;(async () => {
                cacheRef.current = await cacheFactory(options)
                setIsLoaded(true)
            })()
            return () => {
                cacheRef.current = undefined
            }
        }, [])

        useEffect(() => {
            if (isLoaded && onReady) {
                onReady()
            }
        }, [isLoaded])

        return (
            <Context.Provider value={cacheRef.current}>
                {children}
            </Context.Provider>
        )
    }
    return [Context, CacheProvider]
}

export function useCache(name: string, storeName: string): CacheWrapper {
    const context = contexts[name]?.[storeName]
    if (!context) {
        throw new Error()
    }
    const cache = useContext(context)
    if (!cache) {
        throw new Error()
    }
    return cache
}
