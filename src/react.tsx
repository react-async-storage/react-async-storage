import { DEFAULTS } from './constants'
import { StorageProviderProps } from './types'
import { StorageWrapper } from './wrapper'
import { ValueError } from './errors'
import { cacheFactory } from './core'
import React, {
    PropsWithChildren,
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react'

export const StorageContext = createContext<Record<string, StorageWrapper>>({})

export function StorageProvider({
    onReady,
    options,
    children,
}: PropsWithChildren<StorageProviderProps>): React.ReactElement {
    const isMountedRef = useRef(true)
    const [isLoaded, setIsLoaded] = useState(false)
    const [wrappers, setWrappers] = useState<Record<string, StorageWrapper>>({})
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

export function useStorage(
    storeName: string = DEFAULTS.STORE_NAME,
): StorageWrapper {
    const context = useContext(StorageContext)
    if (!Reflect.has(context, storeName)) {
        throw new ValueError(`invalid storeName ${storeName}`)
    }
    return context[storeName]
}
