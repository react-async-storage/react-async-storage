/* eslint-disable react-hooks/rules-of-hooks */
import '@testing-library/jest-dom/extend-expect'
import {
    DEFAULTS,
    StorageOptions,
    StorageProvider,
    StorageWrapper,
    ValueError,
    dropCacheInstance,
    useStorage,
} from '../src'
import { act, render } from '@testing-library/react'
import React, { useState } from 'react'

const TEST_ID = 'cacheStoreName'

const NestedComponent = (props: {
    isLoaded: boolean
    storeName?: string | string[]
    cb: (wrappers: any) => void
    errorCb?: (error: any) => void
}): React.ReactElement => {
    let caches: StorageWrapper[] | undefined
    if (props.isLoaded) {
        try {
            caches = props.storeName
                ? Array.isArray(props.storeName)
                    ? props.storeName.map((name) => useStorage(name))
                    : [useStorage(props.storeName)]
                : [useStorage()]
            props.cb(caches)
        } catch (error) {
            if (props.errorCb) props.errorCb(error)
            else {
                throw error
            }
        }
    }
    return (
        <div data-testid={TEST_ID}>
            {caches?.map((cache) => cache.storeName).join(',')}
        </div>
    )
}
const TestWrapper = (props: {
    configs?: StorageOptions | StorageOptions[]
    cb: (wrappers: any) => void
    storeName?: string | string[]
    errorCb?: (error: any) => void
}): React.ReactElement => {
    const [isLoaded, setIsLoaded] = useState(false)
    return (
        <StorageProvider
            options={props.configs}
            onReady={() => setIsLoaded(true)}
        >
            <NestedComponent
                cb={props.cb}
                errorCb={props.errorCb}
                storeName={props.storeName ?? undefined}
                isLoaded={isLoaded}
            />
        </StorageProvider>
    )
}

describe('Provider tests', () => {
    const customName = 'customName'
    describe('useStorage hook tests', () => {
        it('retrieves cache wrapper instances correctly', async () => {
            let wrappers: StorageWrapper[]
            const cb = (val: StorageWrapper[]) => {
                wrappers = val
            }
            const { getByTestId } = render(<TestWrapper cb={cb} />)
            await act(async () => Promise.resolve())
            //@ts-ignore
            for (const wrapper of wrappers) {
                expect(wrapper).toBeInstanceOf(StorageWrapper)
            }
            expect(getByTestId(TEST_ID)).toHaveTextContent(DEFAULTS.STORE_NAME)
            await dropCacheInstance()
        })
        it('throws error on invalid storeName', async () => {
            let error: any
            const errorCb = (val: any) => {
                error = val
            }
            render(
                <TestWrapper
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    cb={() => {}}
                    storeName={'invalidStoreName'}
                    errorCb={errorCb}
                />,
            )
            await act(async () => await Promise.resolve())
            expect(error).toBeInstanceOf(ValueError)
        })
    })
    it('creates a custom instance correctly', async () => {
        let wrappers: StorageWrapper[]
        const cb = (val: StorageWrapper[]) => {
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
            expect(wrapper).toBeInstanceOf(StorageWrapper)
        }
        expect(getByTestId(TEST_ID)).toHaveTextContent(customName)
        await dropCacheInstance(customName)
    })
    it('creates multiple custom instances correctly', async () => {
        let wrappers: StorageWrapper[]
        const cb = (val: StorageWrapper[]) => {
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
            expect(wrapper).toBeInstanceOf(StorageWrapper)
        }
        expect(getByTestId(TEST_ID)).toHaveTextContent(
            [customName, 'customName2', 'customName3'].join(','),
        )
        await dropCacheInstance(customName)
    })
})
