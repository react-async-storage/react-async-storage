import '@testing-library/jest-dom/extend-expect'
import {
    CacheOptions,
    CacheProvider,
    CacheWrapper,
    DEFAULTS,
    useCache,
} from '../src'
import { act, render } from '@testing-library/react'
import React, { useEffect, useState } from 'react'

const TEST_ID = 'cacheStoreName'

const NestedComponent = (props: {
    isLoaded: boolean
    storeName?: string
    cb: (wrappers: any) => void
}): React.ReactElement => {
    let cache: CacheWrapper | undefined
    if (props.isLoaded) {
        cache = useCache(props.storeName)
        props.cb(cache)
    }
    return <div data-testid={TEST_ID}>{!!cache && cache.storeName}</div>
}
const TestWrapper = (props: {
    configs?: CacheOptions | CacheOptions[]
    cb: (wrappers: any) => void
    storeName?: string
}): React.ReactElement => {
    const [isLoaded, setIsLoaded] = useState(false)
    return (
        <CacheProvider
            options={props.configs}
            onReady={() => setIsLoaded(true)}
        >
            <NestedComponent
                cb={props.cb}
                storeName={props.storeName}
                isLoaded={isLoaded}
            />
        </CacheProvider>
    )
}

describe('Provider tests', () => {
    it('creates a default instance correctly', async () => {
        let value: CacheWrapper | null = null
        const cb = (wrapper: CacheWrapper) => {
            value = wrapper
        }
        const { getByTestId } = render(<TestWrapper cb={cb} />)
        await act(async () => Promise.resolve())
        expect(value).toBeInstanceOf(CacheWrapper)
        expect(getByTestId(TEST_ID)).toHaveTextContent(DEFAULTS.STORE_NAME)
    })
})
