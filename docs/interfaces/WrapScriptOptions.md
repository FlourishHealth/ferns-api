[ferns-api](../README.md) / [Exports](../modules.md) / WrapScriptOptions

# Interface: WrapScriptOptions

## Table of contents

### Properties

- [slackChannel](WrapScriptOptions.md#slackchannel)
- [terminateTimeout](WrapScriptOptions.md#terminatetimeout)

### Methods

- [onFinish](WrapScriptOptions.md#onfinish)

## Properties

### slackChannel

• `Optional` **slackChannel**: `string`

#### Defined in

[src/expressServer.ts:246](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L246)

___

### terminateTimeout

• `Optional` **terminateTimeout**: `number`

#### Defined in

[src/expressServer.ts:245](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L245)

## Methods

### onFinish

▸ `Optional` **onFinish**(`result?`): `void` \| `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `result?` | `any` |

#### Returns

`void` \| `Promise`<`void`\>

#### Defined in

[src/expressServer.ts:244](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L244)
