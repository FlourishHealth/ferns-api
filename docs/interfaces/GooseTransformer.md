[ferns-api](../README.md) / [Exports](../modules.md) / GooseTransformer

# Interface: GooseTransformer<T\>

## Type parameters

| Name |
| :------ |
| `T` |

## Table of contents

### Methods

- [serialize](GooseTransformer.md#serialize)
- [transform](GooseTransformer.md#transform)

## Methods

### serialize

▸ `Optional` **serialize**(`obj`, `user?`): `undefined` \| `Partial`<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `T` |
| `user?` | [`User`](User.md) |

#### Returns

`undefined` \| `Partial`<`T`\>

#### Defined in

[src/api.ts:51](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L51)

___

### transform

▸ `Optional` **transform**(`obj`, `method`, `user?`): `undefined` \| `Partial`<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `Partial`<`T`\> |
| `method` | ``"create"`` \| ``"update"`` |
| `user?` | [`User`](User.md) |

#### Returns

`undefined` \| `Partial`<`T`\>

#### Defined in

[src/api.ts:48](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L48)
