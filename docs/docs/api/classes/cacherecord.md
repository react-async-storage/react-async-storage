---
id: 'cacherecord'
title: 'Class: CacheRecord<T>'
sidebar_label: 'CacheRecord'
---

## Type parameters

| Name | Default |
| ---- | ------- |
| `T`  | any     |

## Hierarchy

-   **CacheRecord**

## Constructors

### constructor

\+ **new CacheRecord**(`key`: string, `version`: string, `value`: T \| [Setter](../globals.md#setter)&#60;T>, `maxAge?`: [MaxAge](../globals.md#maxage)): [CacheRecord](cacherecord.md)

_Defined in [src/record.ts:9](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L9)_

#### Parameters:

| Name      | Type                                       |
| --------- | ------------------------------------------ |
| `key`     | string                                     |
| `version` | string                                     |
| `value`   | T \| [Setter](../globals.md#setter)&#60;T> |
| `maxAge?` | [MaxAge](../globals.md#maxage)             |

**Returns:** [CacheRecord](cacherecord.md)

## Properties

### expiration

• `Optional` **expiration**: number

_Defined in [src/record.ts:9](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L9)_

---

### key

• **key**: string

_Defined in [src/record.ts:6](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L6)_

---

### value

• **value**: T

_Defined in [src/record.ts:8](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L8)_

---

### version

• **version**: string

_Defined in [src/record.ts:7](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L7)_

## Methods

### isStale

▸ **isStale**(): boolean

_Defined in [src/record.ts:24](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L24)_

**Returns:** boolean

---

### setExpiration

▸ **setExpiration**(`maxAge?`: [MaxAge](../globals.md#maxage)): void

_Defined in [src/record.ts:36](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L36)_

#### Parameters:

| Name      | Type                           |
| --------- | ------------------------------ |
| `maxAge?` | [MaxAge](../globals.md#maxage) |

**Returns:** void

---

### setValue

▸ **setValue**(`value`: [UpdateSetter](../globals.md#updatesetter)&#60;T> \| T): void

_Defined in [src/record.ts:72](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L72)_

#### Parameters:

| Name    | Type                                                   |
| ------- | ------------------------------------------------------ |
| `value` | [UpdateSetter](../globals.md#updatesetter)&#60;T> \| T |

**Returns:** void

---

### toObject

▸ **toObject**(): [CacheObject](../interfaces/cacheobject.md)&#60;T>

_Defined in [src/record.ts:28](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L28)_

**Returns:** [CacheObject](../interfaces/cacheobject.md)&#60;T>

---

### from

▸ `Static`**from**&#60;T>(`cacheObject`: [CacheObject](../interfaces/cacheobject.md)&#60;T>): [CacheRecord](cacherecord.md)&#60;T>

_Defined in [src/record.ts:76](https://github.com/Goldziher/rn-async-storage-cache-wrapper/blob/325beed/src/record.ts#L76)_

#### Type parameters:

| Name |
| ---- |
| `T`  |

#### Parameters:

| Name          | Type                                               |
| ------------- | -------------------------------------------------- |
| `cacheObject` | [CacheObject](../interfaces/cacheobject.md)&#60;T> |

**Returns:** [CacheRecord](cacherecord.md)&#60;T>
