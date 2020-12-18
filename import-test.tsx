import { StorageProvider } from 'react-async-storage'
import React, { useEffect, useState } from 'react'

const StorageComponent = () => {
    const [test, setTest] = useState<null | string>(null)
    useEffect(() => {
        const ls = localStorage.getItem('test')
        setTest(ls)
        localStorage.setItem('test', 'success')
    }, [])

    return <>{test ?? 'failure'}</>
}

function App() {
    return (
        <div className="App">
            <StorageProvider>
                <p>
                    <StorageComponent />
                </p>
            </StorageProvider>
        </div>
    )
}

export default App
