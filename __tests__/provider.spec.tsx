import '@testing-library/jest-dom/extend-expect'
import {
    CacheOptions,
    CacheProvider,
    CacheWrapper,
    DEFAULTS,
    dropCacheInstance,
    useCache,
} from '../src'
import { act, render } from '@testing-library/react'
import React, { useState } from 'react'

const TEST_ID = 'cacheStoreName'

const NestedComponent = (props: {
    isLoaded: boolean
    storeName?: string | string[]
    cb: (wrappers: any) => void
}): React.ReactElement => {
    let caches: CacheWrapper[] | undefined
    if (props.isLoaded) {
        caches = useCache(props.storeName ?? undefined)
        props.cb(caches)
    }
    return (
        <div data-testid={TEST_ID}>
            {caches?.map((cache) => cache.storeName).join(',')}
        </div>
    )
}
const TestWrapper = (props: {
    configs?: CacheOptions | CacheOptions[]
    cb: (wrappers: any) => void
    storeName?: string | string[]
}): React.ReactElement => {
    const [isLoaded, setIsLoaded] = useState(false)
    return (
        <CacheProvider
            options={props.configs}
            onReady={() => setIsLoaded(true)}
        >
            <NestedComponent
                cb={props.cb}
                storeName={props.storeName ?? undefined}
                isLoaded={isLoaded}
            />
        </CacheProvider>
    )
}

describe('Provider tests', () => {
    const customName = 'customName'
    it('creates a default instance correctly', async () => {
        let wrappers: CacheWrapper[]
        const cb = (val: CacheWrapper[]) => {
            wrappers = val
        }
        const { getByTestId } = render(<TestWrapper cb={cb} />)
        await act(async () => Promise.resolve())
        //@ts-ignore
        for (const wrapper of wrappers) {
            expect(wrapper).toBeInstanceOf(CacheWrapper)
        }
        expect(getByTestId(TEST_ID)).toHaveTextContent(DEFAULTS.STORE_NAME)
        await dropCacheInstance()
    })
    it('creates a custom instance correctly', async () => {
        let wrappers: CacheWrapper[]
        const cb = (val: CacheWrapper[]) => {
            wrappers = val
        }
        const { getByTestId } = render(
            <TestWrapper
                cb={cb}
                storeName={customName}
                configs={[{ storeName: customName }]}
            />,
        )
        await act(async () => Promise.resolve())
        //@ts-ignore
        for (const wrapper of wrappers) {
            expect(wrapper).toBeInstanceOf(CacheWrapper)
        }
        expect(getByTestId(TEST_ID)).toHaveTextContent(customName)
        await dropCacheInstance(customName)
    })
    it('creates multiple custom instances correctly', async () => {
        let wrappers: CacheWrapper[]
        const cb = (val: CacheWrapper[]) => {
            wrappers = val
        }
        const { getByTestId } = render(
            <TestWrapper
                cb={cb}
                storeName={[customName, 'customName2', 'customName3']}
                configs={[
                    { storeName: customName },
                    { storeName: 'customName2' },
                    { storeName: 'customName3' },
                ]}
            />,
        )
        await act(async () => Promise.resolve())
        //@ts-ignore
        for (const wrapper of wrappers) {
            expect(wrapper).toBeInstanceOf(CacheWrapper)
        }
        expect(getByTestId(TEST_ID)).toHaveTextContent(
            [customName, 'customName2', 'customName3'].join(','),
        )
        await dropCacheInstance(customName)
    })
})
