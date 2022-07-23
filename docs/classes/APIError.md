[ferns-api](../README.md) / [Exports](../modules.md) / APIError

# Class: APIError

## Hierarchy

- `Error`

  ↳ **`APIError`**

## Table of contents

### Constructors

- [constructor](APIError.md#constructor)

### Properties

- [about](APIError.md#about)
- [code](APIError.md#code)
- [detail](APIError.md#detail)
- [id](APIError.md#id)
- [links](APIError.md#links)
- [message](APIError.md#message)
- [meta](APIError.md#meta)
- [name](APIError.md#name)
- [parameter](APIError.md#parameter)
- [pointer](APIError.md#pointer)
- [source](APIError.md#source)
- [stack](APIError.md#stack)
- [status](APIError.md#status)
- [title](APIError.md#title)
- [prepareStackTrace](APIError.md#preparestacktrace)
- [stackTraceLimit](APIError.md#stacktracelimit)

### Methods

- [captureStackTrace](APIError.md#capturestacktrace)

## Constructors

### constructor

• **new APIError**(`data`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`APIErrorConstructor`](../interfaces/APIErrorConstructor.md) |

#### Overrides

Error.constructor

#### Defined in

[src/errors.ts:65](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L65)

## Properties

### about

• **about**: `undefined` \| `string`

#### Defined in

[src/errors.ts:49](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L49)

___

### code

• **code**: `undefined` \| `string`

#### Defined in

[src/errors.ts:53](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L53)

___

### detail

• **detail**: `undefined` \| `string`

#### Defined in

[src/errors.ts:55](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L55)

___

### id

• **id**: `undefined` \| `string`

#### Defined in

[src/errors.ts:45](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L45)

___

### links

• **links**: `undefined` \| `string`

#### Defined in

[src/errors.ts:47](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L47)

___

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:974

___

### meta

• **meta**: `undefined` \| { `[id: string]`: `any`;  }

#### Defined in

[src/errors.ts:63](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L63)

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:973

___

### parameter

• **parameter**: `undefined` \| `string`

#### Defined in

[src/errors.ts:61](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L61)

___

### pointer

• **pointer**: `undefined` \| `string`

#### Defined in

[src/errors.ts:59](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L59)

___

### source

• **source**: `undefined` \| `string`

#### Defined in

[src/errors.ts:57](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L57)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:975

___

### status

• **status**: `number`

#### Defined in

[src/errors.ts:51](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L51)

___

### title

• **title**: `string`

#### Defined in

[src/errors.ts:43](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L43)

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

Error.prepareStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:11

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

#### Defined in

node_modules/@types/node/globals.d.ts:13

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:4
