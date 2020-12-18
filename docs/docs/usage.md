---
id: usage
title: Usage
sidebar_label: Usage
slug: /usage/
---

Before you can interact with your storage, it has to be configured and initiated.

### Using the StorageProvider

The simplest way to do this, is to place the Provider component exported by this library as a wrapper inside the main App component:

```jsx
// App.js
import { StorageProvider } from 'react-async-storage'
import React from 'react'

export default function App() {
    return <StorageProvider>{/* Rest of your app code */}</StorageProvider>
}
```

The Provider does not need to be the top-most container in the App, but it should wrap all components that need to interact with the storage using the library's `useStorage` hook, and all code that needs to make calls to the async storage during the App's first render. For example:

```jsx
// App.js
import { StorageProvider } from 'react-async-storage'
import React from 'react'

import { MyReduxStoreProvider } from './store'

export default function App() {
    return (
        <React.Fragment>
            <StorageProvider>
                <MyReduxStoreProvider>
                    {/* Rest of your app code */}
                </MyReduxStoreProvider>
            </StorageProvider>
        </React.Fragment>
    )
}
```

In the above example, the ReduxStoreProvider is located inside the StorageProvider tag to ensure async store actions can rely on the async storage during the init process.

### Passing Configs

You can pass configs to the provider using the `options` prop. This prop accepts either a config object or an array of config objects:

```jsx
// App.js
import { StorageProvider } from "react-async-storage"
import React from 'react'

const storageConfigs = [
  {
    storeName: "mainStore",
    version: "1.0.1",
  },
  {
    storeName: "otherStore",
    version "1.0.0",
  }
]

export default function App() {
  return (
    <StorageProvider options={storageConfigs}>{/* Rest of your app code */}</StorageProvider>
  )
}

```

> Note: this is completely optional - if you do not pass configs, the library's DEFAULTS **(INSERT LINK)** will be used.

### Using Storage

With the `StorageProvider` in place, you can now use the storage in one of 3 ways:

#### 1. useStorage Hook

If you are using functional components, you can use the `useStorage` hook, which offers a convenient way to access a store inside a react component.

```tsx
import { useStorage } from "react-async-storage"
import React, { useState, useEffect } from 'react'

export default function MyComponent() {
  const [myCachedValue, setMyCachedValue] = useState<MyInterface | null>(null)
  /*
    useStorage receives an optional string or an array of strings as a parameter - each representing a "storeName".

    If no parameter is provided it will try to return the default store name, so make sure to specify the storeName if you renamed the default store.
  */
  const [mainStore] = useStorage("mainStore")

  useEffect(() => {
    /*
      Interacting with the store for getItem/setItem/removeItem method calls is async.
      It should therefore happen inside an async function call or a useEffect block inside a component.
    */
    ;(async () => {
      const cachedValue = await mainStore.getItem<MyInterface>("someCacheKey")
      setMyCachedValue(cachedValue)
    })()
  }, [])
  ...
}

```

#### 2. using the StorageContext

If you are using class based components, you can use the StorageContext in you component directly:

```tsx
import { StorageContext } from "react-async-storage"
import React, { Component } from 'react'
import ApiClient from "../api"
import { User } from "../types"


class MyComponent extends Component {
  static contextType = StorageContext

  async fetchUser(): Promise<User> {
    /*
    context.get receives an optional string or an array of strings as a parameter - each representing a "storeName".

    If no parameter is provided it will try to return the default store name, so make sure to specify the storeName if you renamed the default store.
    */
    const store = this.context.get("mainStore")

    if (store.has("someKey")) {
      return await store.getItem<User>("someKey")
    } else {
      const user = await ApiClient.get<User>("/user")
      await store.setItem("someKey", user)
      return user
    }

    ...
  }
}

```

### 3. using the getCache helper
