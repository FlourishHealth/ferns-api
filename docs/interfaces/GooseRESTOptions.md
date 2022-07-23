[ferns-api](../README.md) / [Exports](../modules.md) / GooseRESTOptions

# Interface: GooseRESTOptions<T\>

## Type parameters

| Name | Description |
| :------ | :------ |
| `T` |  |

## Table of contents

### Properties

- [defaultLimit](GooseRESTOptions.md#defaultlimit)
- [defaultQueryParams](GooseRESTOptions.md#defaultqueryparams)
- [discriminatorKey](GooseRESTOptions.md#discriminatorkey)
- [maxLimit](GooseRESTOptions.md#maxlimit)
- [permissions](GooseRESTOptions.md#permissions)
- [populatePaths](GooseRESTOptions.md#populatepaths)
- [queryFields](GooseRESTOptions.md#queryfields)
- [sort](GooseRESTOptions.md#sort)
- [transformer](GooseRESTOptions.md#transformer)

### Methods

- [endpoints](GooseRESTOptions.md#endpoints)
- [postCreate](GooseRESTOptions.md#postcreate)
- [postDelete](GooseRESTOptions.md#postdelete)
- [postUpdate](GooseRESTOptions.md#postupdate)
- [preCreate](GooseRESTOptions.md#precreate)
- [preDelete](GooseRESTOptions.md#predelete)
- [preUpdate](GooseRESTOptions.md#preupdate)
- [queryFilter](GooseRESTOptions.md#queryfilter)

## Properties

### defaultLimit

• `Optional` **defaultLimit**: `number`

#### Defined in

[src/api.ts:110](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L110)

___

### defaultQueryParams

• `Optional` **defaultQueryParams**: `Object`

#### Index signature

▪ [key: `string`]: `any`

#### Defined in

[src/api.ts:108](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L108)

___

### discriminatorKey

• `Optional` **discriminatorKey**: `string`

#### Defined in

[src/api.ts:121](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L121)

___

### maxLimit

• `Optional` **maxLimit**: `number`

#### Defined in

[src/api.ts:111](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L111)

___

### permissions

• **permissions**: [`RESTPermissions`](RESTPermissions.md)<`T`\>

#### Defined in

[src/api.ts:101](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L101)

___

### populatePaths

• `Optional` **populatePaths**: `string`[]

#### Defined in

[src/api.ts:109](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L109)

___

### queryFields

• `Optional` **queryFields**: `string`[]

#### Defined in

[src/api.ts:103](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L103)

___

### sort

• `Optional` **sort**: `string` \| { `[key: string]`: ``"ascending"`` \| ``"descending"``;  }

#### Defined in

[src/api.ts:107](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L107)

___

### transformer

• `Optional` **transformer**: [`GooseTransformer`](GooseTransformer.md)<`T`\>

#### Defined in

[src/api.ts:106](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L106)

## Methods

### endpoints

▸ `Optional` **endpoints**(`router`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `router` | `any` |

#### Returns

`void`

#### Defined in

[src/api.ts:112](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L112)

___

### postCreate

▸ `Optional` **postCreate**(`value`, `request`): `void` \| `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |
| `request` | `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\> |

#### Returns

`void` \| `Promise`<`void`\>

#### Defined in

[src/api.ts:116](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L116)

___

### postDelete

▸ `Optional` **postDelete**(`request`): `void` \| `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\> |

#### Returns

`void` \| `Promise`<`void`\>

#### Defined in

[src/api.ts:118](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L118)

___

### postUpdate

▸ `Optional` **postUpdate**(`value`, `cleanedBody`, `request`): `void` \| `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |
| `cleanedBody` | `any` |
| `request` | `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\> |

#### Returns

`void` \| `Promise`<`void`\>

#### Defined in

[src/api.ts:117](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L117)

___

### preCreate

▸ `Optional` **preCreate**(`value`, `request`): ``null`` \| `T` \| `Promise`<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |
| `request` | `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\> |

#### Returns

``null`` \| `T` \| `Promise`<`T`\>

#### Defined in

[src/api.ts:113](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L113)

___

### preDelete

▸ `Optional` **preDelete**(`value`, `request`): ``null`` \| `T` \| `Promise`<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |
| `request` | `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\> |

#### Returns

``null`` \| `T` \| `Promise`<`T`\>

#### Defined in

[src/api.ts:115](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L115)

___

### preUpdate

▸ `Optional` **preUpdate**(`value`, `request`): ``null`` \| `T` \| `Promise`<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |
| `request` | `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\> |

#### Returns

``null`` \| `T` \| `Promise`<`T`\>

#### Defined in

[src/api.ts:114](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L114)

___

### queryFilter

▸ `Optional` **queryFilter**(`user?`, `query?`): ``null`` \| `Record`<`string`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `user?` | [`User`](User.md) |
| `query?` | `Record`<`string`, `any`\> |

#### Returns

``null`` \| `Record`<`string`, `any`\>

#### Defined in

[src/api.ts:105](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L105)
