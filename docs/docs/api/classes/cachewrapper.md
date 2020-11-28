---
id: 'cachewrapper'
title: 'Class: CacheWrapper'
sidebar_label: 'CacheWrapper'
---

## Hierarchy

-   **CacheWrapper**

## Constructors

### constructor

\+ **new CacheWrapper**(`options`: [CacheWrapperOptions](../interfaces/cachewrapperoptions.md)): [CacheWrapper](cachewrapper.md)

_Defined in [src/wrapper.ts:19](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L19)_

#### Parameters:

| Name      | Type                                                        |
| --------- | ----------------------------------------------------------- |
| `options` | [CacheWrapperOptions](../interfaces/cachewrapperoptions.md) |

**Returns:** [CacheWrapper](cachewrapper.md)

## Properties

### allowStale

• `Readonly` **allowStale**: boolean

_Defined in [src/wrapper.ts:14](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L14)_

---

### cache

• `Readonly` **cache**: [Cache](../globals.md#cache) = new Map()

_Defined in [src/wrapper.ts:15](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L15)_

---

### instance

• `Readonly` **instance**: LocalForage

_Defined in [src/wrapper.ts:16](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L16)_

---

### name

• `Readonly` **name**: string

_Defined in [src/wrapper.ts:17](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L17)_

---

### preferCache

• `Readonly` **preferCache**: boolean

_Defined in [src/wrapper.ts:18](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L18)_

---

### version

• `Readonly` **version**: string

_Defined in [src/wrapper.ts:19](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L19)_

## Methods

### clear

▸ **clear**(`callback?`: [NodeCallBack](../globals.md#nodecallback)&#60;never>): Promise&#60;void>

_Defined in [src/wrapper.ts:216](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L216)_

#### Parameters:

| Name        | Type                                                  |
| ----------- | ----------------------------------------------------- |
| `callback?` | [NodeCallBack](../globals.md#nodecallback)&#60;never> |

**Returns:** Promise&#60;void>

---

### getItem

▸ **getItem**&#60;T>(`key`: string, `__namedParameters?`: { allowNull: boolean = true; fallback: T = null }, `callback?`: [NodeCallBack](../globals.md#nodecallback)&#60;T \| null>): Promise&#60;T \| null>

_Defined in [src/wrapper.ts:98](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L98)_

#### Type parameters:

| Name | Default |
| ---- | ------- |
| `T`  | any     |

#### Parameters:

| Name                | Type                                                      | Default value |
| ------------------- | --------------------------------------------------------- | ------------- |
| `key`               | string                                                    | -             |
| `__namedParameters` | { allowNull: boolean = true; fallback: T = null }         | {}            |
| `callback?`         | [NodeCallBack](../globals.md#nodecallback)&#60;T \| null> | -             |

**Returns:** Promise&#60;T \| null>

---

### getRecord

▸ **getRecord**&#60;T>(`key`: string, `__namedParameters?`: { allowNull: boolean = true; preferCache: boolean = this.preferCache }): Promise&#60;[CacheRecord](cacherecord.md)&#60;T> \| null>

_Defined in [src/wrapper.ts:34](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L34)_

#### Type parameters:

| Name | Default |
| ---- | ------- |
| `T`  | any     |

#### Parameters:

| Name                | Type                                                                   | Default value |
| ------------------- | ---------------------------------------------------------------------- | ------------- |
| `key`               | string                                                                 | -             |
| `__namedParameters` | { allowNull: boolean = true; preferCache: boolean = this.preferCache } | {}            |

**Returns:** Promise&#60;[CacheRecord](cacherecord.md)&#60;T> \| null>

---

### getRecords

▸ **getRecords**(`preferCache?`: boolean, `callback?`: [NodeCallBack](../globals.md#nodecallback)&#60;[CacheRecord](cacherecord.md)[]>): Promise&#60;[CacheRecord](cacherecord.md)[]>

_Defined in [src/wrapper.ts:225](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L225)_

#### Parameters:

| Name          | Type                                                                            | Default value |
| ------------- | ------------------------------------------------------------------------------- | ------------- |
| `preferCache` | boolean                                                                         | true          |
| `callback?`   | [NodeCallBack](../globals.md#nodecallback)&#60;[CacheRecord](cacherecord.md)[]> | -             |

**Returns:** Promise&#60;[CacheRecord](cacherecord.md)[]>

---

### hasItem

▸ **hasItem**(`key`: string): boolean

_Defined in [src/wrapper.ts:30](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L30)_

#### Parameters:

| Name  | Type   |
| ----- | ------ |
| `key` | string |

**Returns:** boolean

---

### keys

▸ **keys**(`callback?`: [NodeCallBack](../globals.md#nodecallback)&#60;string[]>): Promise&#60;string[]>

_Defined in [src/wrapper.ts:221](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L221)_

#### Parameters:

| Name        | Type                                                     |
| ----------- | -------------------------------------------------------- |
| `callback?` | [NodeCallBack](../globals.md#nodecallback)&#60;string[]> |

**Returns:** Promise&#60;string[]>

---

### mergeItem

▸ **mergeItem**&#60;T>(`key`: string, `value`: T, `callback?`: [NodeCallBack](../globals.md#nodecallback)&#60;T>): Promise&#60;T \| void>

_Defined in [src/wrapper.ts:161](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L161)_

#### Type parameters:

| Name |
| ---- |
| `T`  |

#### Parameters:

| Name        | Type                                              |
| ----------- | ------------------------------------------------- |
| `key`       | string                                            |
| `value`     | T                                                 |
| `callback?` | [NodeCallBack](../globals.md#nodecallback)&#60;T> |

**Returns:** Promise&#60;T \| void>

---

### multiGet

▸ **multiGet**(`keys`: string[]): Promise&#60;[string, any][]>

_Defined in [src/wrapper.ts:182](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L182)_

#### Parameters:

| Name   | Type     |
| ------ | -------- |
| `keys` | string[] |

**Returns:** Promise&#60;[string, any][]>

---

### multiRemove

▸ **multiRemove**(`keys`: string[]): Promise&#60;void>

_Defined in [src/wrapper.ts:207](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L207)_

#### Parameters:

| Name   | Type     |
| ------ | -------- |
| `keys` | string[] |

**Returns:** Promise&#60;void>

---

### multiSet

▸ **multiSet**(`values`: { key: string ; maxAge?: [MaxAge](../globals.md#maxage) ; value: any }[]): Promise&#60;void>

_Defined in [src/wrapper.ts:192](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L192)_

#### Parameters:

| Name     | Type                                                                     |
| -------- | ------------------------------------------------------------------------ |
| `values` | { key: string ; maxAge?: [MaxAge](../globals.md#maxage) ; value: any }[] |

**Returns:** Promise&#60;void>

---

### removeItem

▸ **removeItem**(`key`: string, `callback?`: [NodeCallBack](../globals.md#nodecallback)&#60;never>): Promise&#60;void>

_Defined in [src/wrapper.ts:153](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L153)_

#### Parameters:

| Name        | Type                                                  |
| ----------- | ----------------------------------------------------- |
| `key`       | string                                                |
| `callback?` | [NodeCallBack](../globals.md#nodecallback)&#60;never> |

**Returns:** Promise&#60;void>

---

### setItem

▸ **setItem**&#60;T>(`key`: string, `value`: [Setter](../globals.md#setter)&#60;T> \| T, `maxAge?`: [MaxAge](../globals.md#maxage), `callback?`: [NodeCallBack](../globals.md#nodecallback)&#60;[CacheRecord](cacherecord.md)&#60;T>>): Promise&#60;void>

_Defined in [src/wrapper.ts:131](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L131)_

#### Type parameters:

| Name | Default |
| ---- | ------- |
| `T`  | any     |

#### Parameters:

| Name        | Type                                                                                 |
| ----------- | ------------------------------------------------------------------------------------ |
| `key`       | string                                                                               |
| `value`     | [Setter](../globals.md#setter)&#60;T> \| T                                           |
| `maxAge?`   | [MaxAge](../globals.md#maxage)                                                       |
| `callback?` | [NodeCallBack](../globals.md#nodecallback)&#60;[CacheRecord](cacherecord.md)&#60;T>> |

**Returns:** Promise&#60;void>

---

### updateRecord

▸ **updateRecord**&#60;T>(`key`: string, `options?`: { maxAge?: [MaxAge](../globals.md#maxage) ; value?: [UpdateSetter](../globals.md#updatesetter)&#60;T> \| T ; version?: string } \| null, `callback?`: [NodeCallBack](../globals.md#nodecallback)&#60;[CacheRecord](cacherecord.md)&#60;T>>): Promise&#60;[CacheRecord](cacherecord.md)&#60;T>>

_Defined in [src/wrapper.ts:64](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/wrapper.ts#L64)_

#### Type parameters:

| Name | Default |
| ---- | ------- |
| `T`  | any     |

#### Parameters:

| Name        | Type                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `key`       | string                                                                                                                                  |
| `options?`  | { maxAge?: [MaxAge](../globals.md#maxage) ; value?: [UpdateSetter](../globals.md#updatesetter)&#60;T> \| T ; version?: string } \| null |
| `callback?` | [NodeCallBack](../globals.md#nodecallback)&#60;[CacheRecord](cacherecord.md)&#60;T>>                                                    |

**Returns:** Promise&#60;[CacheRecord](cacherecord.md)&#60;T>>
