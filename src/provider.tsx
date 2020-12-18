import { CacheWrapper } from './wrapper'
import { StorageProviderProps } from './types'
import { cacheFactory } from './core'
import React, {
    PropsWithChildren,
    createContext,
    useEffect,
    useRef,
    useState,
} from 'react'

export const StorageContext = createContext<Record<string, CacheWrapper>>({})

export function StorageProvider({
    onReady,
    options,
    children,
}: PropsWithChildren<StorageProviderProps>): React.ReactElement {
    const isMountedRef = useRef(true)
    const [isLoaded, setIsLoaded] = useState(false)
    const [wrappers, setWrappers] = useState<Record<string, CacheWrapper>>({})
    useEffect(() => {
        /* istanbul ignore next - its not worth the effort typing to test the branching here */
        if (isMountedRef.current) {
            ;(async () => {
                const wrappers = await cacheFactory(options)
                setWrappers(wrappers)
                setIsLoaded(true)
            })()
        }
        return () => {
            isMountedRef.current = false
        }
    }, [options])

    useEffect(() => {
        if (isLoaded && onReady) {
            onReady()
        }
    }, [isLoaded])

    return (
        <StorageContext.Provider value={wrappers}>
            {children}
        </StorageContext.Provider>
    )
}
