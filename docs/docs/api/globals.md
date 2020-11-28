---
id: 'globals'
title: 'r-cache'
sidebar_label: 'Globals'
---

## Index

### Classes

-   [CacheError](classes/cacheerror.md)
-   [CacheRecord](classes/cacherecord.md)
-   [CacheWrapper](classes/cachewrapper.md)
-   [ValueError](classes/valueerror.md)

### Interfaces

-   [CacheObject](interfaces/cacheobject.md)
-   [CacheOptions](interfaces/cacheoptions.md)
-   [CacheWrapperOptions](interfaces/cachewrapperoptions.md)

### Type aliases

-   [Cache](globals.md#cache)
-   [MaxAge](globals.md#maxage)
-   [NodeCallBack](globals.md#nodecallback)
-   [Setter](globals.md#setter)
-   [TimeUnit](globals.md#timeunit)
-   [UpdateSetter](globals.md#updatesetter)

### Functions

-   [createCacheInstance](globals.md#createcacheinstance)
-   [dropCacheInstance](globals.md#dropcacheinstance)
-   [now](globals.md#now)
-   [retrieveAndPruneRecords](globals.md#retrieveandprunerecords)

### Object literals

-   [state](globals.md#state)

## Type aliases

### Cache

Ƭ **Cache**: Map&#60;string, [CacheRecord](classes/cacherecord.md)>

_Defined in [src/types.ts:3](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/types.ts#L3)_

---

### MaxAge

Ƭ **MaxAge**: number \| [number, [TimeUnit](globals.md#timeunit)]

_Defined in [src/types.ts:35](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/types.ts#L35)_

---

### NodeCallBack

Ƭ **NodeCallBack**&#60;T>: (error: [Error](classes/cacheerror.md#error) \| null, value?: T) => void

_Defined in [src/types.ts:36](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/types.ts#L36)_

#### Type parameters:

| Name | Default |
| ---- | ------- |
| `T`  | any     |

---

### Setter

Ƭ **Setter**&#60;T>: () => T

_Defined in [src/types.ts:37](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/types.ts#L37)_

#### Type parameters:

| Name |
| ---- |
| `T`  |

---

### TimeUnit

Ƭ **TimeUnit**: &#34;second&#34; \| &#34;minute&#34; \| &#34;hour&#34; \| &#34;day&#34; \| &#34;week&#34; \| &#34;month&#34; \| &#34;year&#34;

_Defined in [src/types.ts:26](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/types.ts#L26)_

---

### UpdateSetter

Ƭ **UpdateSetter**&#60;T>: (value: T) => T

_Defined in [src/types.ts:38](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/types.ts#L38)_

#### Type parameters:

| Name |
| ---- |
| `T`  |

## Functions

### createCacheInstance

▸ **createCacheInstance**(`__namedParameters?`: { allowStale: boolean = false; name: string = "RCache"; preferCache: boolean = true; rest: rest ; storeName: string = "defaultCache"; version: string = "1.0.0" }): Promise&#60;[CacheWrapper](classes/cachewrapper.md)>

_Defined in [src/index.ts:53](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/index.ts#L53)_

#### Parameters:

| Name                | Type                                                                                                                                                              | Default value |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `__namedParameters` | { allowStale: boolean = false; name: string = "RCache"; preferCache: boolean = true; rest: rest ; storeName: string = "defaultCache"; version: string = "1.0.0" } | {}            |

**Returns:** Promise&#60;[CacheWrapper](classes/cachewrapper.md)>

---

### dropCacheInstance

▸ **dropCacheInstance**(`__namedParameters?`: { name: string = "RCache"; storeName: string = "defaultCache" }): Promise&#60;void>

_Defined in [src/index.ts:108](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/index.ts#L108)_

#### Parameters:

| Name                | Type                                                            | Default value |
| ------------------- | --------------------------------------------------------------- | ------------- |
| `__namedParameters` | { name: string = "RCache"; storeName: string = "defaultCache" } | {}            |

**Returns:** Promise&#60;void>

---

### now

▸ `Const`**now**(): number

_Defined in [src/record.ts:4](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L4)_

**Returns:** number

---

### retrieveAndPruneRecords

▸ `Const`**retrieveAndPruneRecords**(`allowStale`: boolean, `instance`: LocalForage, `version`: string): Promise&#60;[CacheRecord](classes/cacherecord.md)[]>

_Defined in [src/index.ts:18](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/index.ts#L18)_

#### Parameters:

| Name         | Type        |
| ------------ | ----------- |
| `allowStale` | boolean     |
| `instance`   | LocalForage |
| `version`    | string      |

**Returns:** Promise&#60;[CacheRecord](classes/cacherecord.md)[]>

## Object literals

### state

▪ `Const` **state**: object

_Defined in [src/index.ts:12](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/index.ts#L12)_

#### Properties:

| Name              | Type   | Value |
| ----------------- | ------ | ----- |
| `init`            | false  | false |
| `rnDriverDefined` | false  | false |
| `wrappers`        | object | {}    |
