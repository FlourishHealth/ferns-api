[ferns-api](README.md) / Exports

# ferns-api

## Table of contents

### Classes

- [APIError](classes/APIError.md)

### Interfaces

- [APIErrorConstructor](interfaces/APIErrorConstructor.md)
- [BaseUser](interfaces/BaseUser.md)
- [CreatedDeleted](interfaces/CreatedDeleted.md)
- [Env](interfaces/Env.md)
- [GooseRESTOptions](interfaces/GooseRESTOptions.md)
- [GooseTransformer](interfaces/GooseTransformer.md)
- [IsDeleted](interfaces/IsDeleted.md)
- [LoggingOptions](interfaces/LoggingOptions.md)
- [Options](interfaces/Options.md)
- [RESTPermissions](interfaces/RESTPermissions.md)
- [SetupServerOptions](interfaces/SetupServerOptions.md)
- [User](interfaces/User.md)
- [UserModel](interfaces/UserModel.md)
- [WrapScriptOptions](interfaces/WrapScriptOptions.md)

### Type Aliases

- [AddRoutes](modules.md#addroutes)
- [PermissionMethod](modules.md#permissionmethod)
- [RESTMethod](modules.md#restmethod)

### Variables

- [ErrorSchema](modules.md#errorschema)
- [Permissions](modules.md#permissions)
- [logger](modules.md#logger)

### Functions

- [AdminOwnerTransformer](modules.md#adminownertransformer)
- [OwnerQueryFilter](modules.md#ownerqueryfilter)
- [authenticateMiddleware](modules.md#authenticatemiddleware)
- [baseUserPlugin](modules.md#baseuserplugin)
- [checkPermissions](modules.md#checkpermissions)
- [createRouter](modules.md#createrouter)
- [createRouterWithAuth](modules.md#createrouterwithauth)
- [createdUpdatedPlugin](modules.md#createdupdatedplugin)
- [cronjob](modules.md#cronjob)
- [errorsPlugin](modules.md#errorsplugin)
- [firebaseJWTPlugin](modules.md#firebasejwtplugin)
- [getAPIErrorBody](modules.md#getapierrorbody)
- [gooseRestRouter](modules.md#gooserestrouter)
- [isAPIError](modules.md#isapierror)
- [isDeletedPlugin](modules.md#isdeletedplugin)
- [isValidObjectId](modules.md#isvalidobjectid)
- [passportLocalMongoose](modules.md#passportlocalmongoose)
- [sendToSlack](modules.md#sendtoslack)
- [setupAuth](modules.md#setupauth)
- [setupErrorLogging](modules.md#setuperrorlogging)
- [setupLogging](modules.md#setuplogging)
- [setupServer](modules.md#setupserver)
- [signupUser](modules.md#signupuser)
- [tokenPlugin](modules.md#tokenplugin)
- [wrapScript](modules.md#wrapscript)

## Type Aliases

### AddRoutes

Ƭ **AddRoutes**: (`router`: `Router`) => `void`

#### Type declaration

▸ (`router`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `router` | `Router` |

##### Returns

`void`

#### Defined in

[src/expressServer.ts:26](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L26)

___

### PermissionMethod

Ƭ **PermissionMethod**<`T`\>: (`method`: [`RESTMethod`](modules.md#restmethod), `user?`: [`User`](interfaces/User.md), `obj?`: `T`) => `boolean` \| `Promise`<`boolean`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

▸ (`method`, `user?`, `obj?`): `boolean` \| `Promise`<`boolean`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `method` | [`RESTMethod`](modules.md#restmethod) |
| `user?` | [`User`](interfaces/User.md) |
| `obj?` | `T` |

##### Returns

`boolean` \| `Promise`<`boolean`\>

#### Defined in

[src/api.ts:79](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L79)

___

### RESTMethod

Ƭ **RESTMethod**: ``"list"`` \| ``"create"`` \| ``"read"`` \| ``"update"`` \| ``"delete"``

#### Defined in

[src/api.ts:43](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L43)

## Variables

### ErrorSchema

• `Const` **ErrorSchema**: `Schema`<`any`, `Model`<`any`, `any`, `any`, `any`, `any`\>, {}, {}, `any`, {}, ``"type"``, { `about`: `undefined` \| `string` ; `code`: `undefined` \| `string` ; `detail`: `undefined` \| `string` ; `id`: `undefined` \| `string` ; `links`: `undefined` \| `string` ; `meta`: `any` ; `parameter`: `undefined` \| `string` ; `pointer`: `undefined` \| `string` ; `source`: `undefined` \| `string` ; `status`: `undefined` \| `number` ; `title`: `string`  }\>

#### Defined in

[src/errors.ts:99](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L99)

___

### Permissions

• `Const` **Permissions**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `IsAdmin` | (`method`: [`RESTMethod`](modules.md#restmethod), `user?`: [`User`](interfaces/User.md)) => `boolean` |
| `IsAny` | () => `boolean` |
| `IsAuthenticated` | (`method`: [`RESTMethod`](modules.md#restmethod), `user?`: [`User`](interfaces/User.md)) => `boolean` |
| `IsAuthenticatedOrReadOnly` | (`method`: [`RESTMethod`](modules.md#restmethod), `user?`: [`User`](interfaces/User.md)) => `boolean` |
| `IsOwner` | (`method`: [`RESTMethod`](modules.md#restmethod), `user?`: [`User`](interfaces/User.md), `obj?`: `any`) => `any` |
| `IsOwnerOrReadOnly` | (`method`: [`RESTMethod`](modules.md#restmethod), `user?`: [`User`](interfaces/User.md), `obj?`: `any`) => `boolean` |

#### Defined in

[src/api.ts:132](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L132)

___

### logger

• `Const` **logger**: `Logger`

#### Defined in

[src/logger.ts:32](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/logger.ts#L32)

## Functions

### AdminOwnerTransformer

▸ **AdminOwnerTransformer**<`T`\>(`options`): [`GooseTransformer`](interfaces/GooseTransformer.md)<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Object` |
| `options.adminReadFields?` | `string`[] |
| `options.adminWriteFields?` | `string`[] |
| `options.anonReadFields?` | `string`[] |
| `options.anonWriteFields?` | `string`[] |
| `options.authReadFields?` | `string`[] |
| `options.authWriteFields?` | `string`[] |
| `options.ownerReadFields?` | `string`[] |
| `options.ownerWriteFields?` | `string`[] |

#### Returns

[`GooseTransformer`](interfaces/GooseTransformer.md)<`T`\>

#### Defined in

[src/api.ts:525](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L525)

___

### OwnerQueryFilter

▸ **OwnerQueryFilter**(`user?`): ``null`` \| { `ownerId`: `string` = user.id }

#### Parameters

| Name | Type |
| :------ | :------ |
| `user?` | [`User`](interfaces/User.md) |

#### Returns

``null`` \| { `ownerId`: `string` = user.id }

#### Defined in

[src/api.ts:124](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L124)

___

### authenticateMiddleware

▸ **authenticateMiddleware**(`anonymous?`): `any`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `anonymous` | `boolean` | `false` |

#### Returns

`any`

#### Defined in

[src/api.ts:285](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L285)

___

### baseUserPlugin

▸ **baseUserPlugin**(`schema`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `Schema`<`any`, `Model`<`any`, `any`, `any`, `any`, `any`\>, {}, {}, `any`, {}, ``"type"``, {}\> |

#### Returns

`void`

#### Defined in

[src/api.ts:231](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L231)

___

### checkPermissions

▸ **checkPermissions**<`T`\>(`method`, `permissions`, `user?`, `obj?`): `Promise`<`boolean`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `method` | [`RESTMethod`](modules.md#restmethod) |
| `permissions` | [`PermissionMethod`](modules.md#permissionmethod)<`T`\>[] |
| `user?` | [`User`](interfaces/User.md) |
| `obj?` | `T` |

#### Returns

`Promise`<`boolean`\>

#### Defined in

[src/api.ts:181](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L181)

___

### createRouter

▸ **createRouter**(`rootPath`, `addRoutes`, `middleware?`): `any`[]

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `rootPath` | `string` | `undefined` |
| `addRoutes` | [`AddRoutes`](modules.md#addroutes) | `undefined` |
| `middleware` | `any`[] | `[]` |

#### Returns

`any`[]

#### Defined in

[src/expressServer.ts:80](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L80)

___

### createRouterWithAuth

▸ **createRouterWithAuth**(`rootPath`, `addRoutes`, `middleware?`): `any`[]

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `rootPath` | `string` | `undefined` |
| `addRoutes` | (`router`: `Router`) => `void` | `undefined` |
| `middleware` | `any`[] | `[]` |

#### Returns

`any`[]

#### Defined in

[src/expressServer.ts:95](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L95)

___

### createdUpdatedPlugin

▸ **createdUpdatedPlugin**(`schema`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `Schema`<`any`, `Model`<`any`, `any`, `any`, `any`, `any`\>, {}, {}, `any`, {}, ``"type"``, {}\> |

#### Returns

`void`

#### Defined in

[src/api.ts:257](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L257)

___

### cronjob

▸ **cronjob**(`name`, `schedule`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `schedule` | `string` |
| `callback` | () => `void` |

#### Returns

`void`

#### Defined in

[src/expressServer.ts:204](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L204)

___

### errorsPlugin

▸ **errorsPlugin**(`schema`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `Schema`<`any`, `Model`<`any`, `any`, `any`, `any`, `any`\>, {}, {}, `any`, {}, ``"type"``, {}\> |

#### Returns

`void`

#### Defined in

[src/errors.ts:114](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L114)

___

### firebaseJWTPlugin

▸ **firebaseJWTPlugin**(`schema`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `Schema`<`any`, `Model`<`any`, `any`, `any`, `any`, `any`\>, {}, {}, `any`, {}, ``"type"``, {}\> |

#### Returns

`void`

#### Defined in

[src/api.ts:281](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L281)

___

### getAPIErrorBody

▸ **getAPIErrorBody**(`error`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | [`APIError`](classes/APIError.md) |

#### Returns

`Object`

#### Defined in

[src/errors.ts:125](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L125)

___

### gooseRestRouter

▸ **gooseRestRouter**<`T`\>(`baseModel`, `options`): `express.Router`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `baseModel` | `Model`<`any`, {}, {}, {}, `any`\> |  |
| `options` | [`GooseRESTOptions`](interfaces/GooseRESTOptions.md)<`T`\> |  |

#### Returns

`express.Router`

#### Defined in

[src/api.ts:605](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L605)

___

### isAPIError

▸ **isAPIError**(`error`): error is APIError

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |

#### Returns

error is APIError

#### Defined in

[src/errors.ts:118](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/errors.ts#L118)

___

### isDeletedPlugin

▸ **isDeletedPlugin**(`schema`, `defaultValue?`): `void`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `schema` | `Schema`<`any`, `Model`<`any`, `any`, `any`, `any`, `any`\>, {}, {}, `any`, {}, ``"type"``, {}\> | `undefined` |
| `defaultValue` | `boolean` | `false` |

#### Returns

`void`

#### Defined in

[src/api.ts:242](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L242)

___

### isValidObjectId

▸ **isValidObjectId**(`id`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`boolean`

#### Defined in

[src/utils.ts:4](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/utils.ts#L4)

___

### passportLocalMongoose

▸ **passportLocalMongoose**(`schema`, `opts?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `Schema`<`any`, `Model`<`any`, `any`, `any`, `any`, `any`\>, {}, {}, `any`, {}, ``"type"``, {}\> |
| `opts` | `Partial`<[`Options`](interfaces/Options.md)\> |

#### Returns

`void`

#### Defined in

[src/passport.ts:174](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/passport.ts#L174)

___

### sendToSlack

▸ **sendToSlack**(`text`, `channel?`): `Promise`<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `text` | `string` | `undefined` |
| `channel` | `string` | `"bots"` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/expressServer.ts:228](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L228)

___

### setupAuth

▸ **setupAuth**(`app`, `userModel`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `app` | `Application` |
| `userModel` | [`UserModel`](interfaces/UserModel.md) |

#### Returns

`void`

#### Defined in

[src/api.ts:322](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L322)

___

### setupErrorLogging

▸ **setupErrorLogging**(): `void`

#### Returns

`void`

#### Defined in

[src/expressServer.ts:16](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L16)

___

### setupLogging

▸ **setupLogging**(`options?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | [`LoggingOptions`](interfaces/LoggingOptions.md) |

#### Returns

`void`

#### Defined in

[src/logger.ts:66](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/logger.ts#L66)

___

### setupServer

▸ **setupServer**(`options`): `Application`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`SetupServerOptions`](interfaces/SetupServerOptions.md) |

#### Returns

`Application`

#### Defined in

[src/expressServer.ts:172](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L172)

___

### signupUser

▸ **signupUser**(`userModel`, `email`, `password`, `body?`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userModel` | [`UserModel`](interfaces/UserModel.md) |
| `email` | `string` |
| `password` | `string` |
| `body?` | `any` |

#### Returns

`Promise`<`any`\>

#### Defined in

[src/api.ts:293](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L293)

___

### tokenPlugin

▸ **tokenPlugin**(`schema`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `Schema`<`any`, `Model`<`any`, `any`, `any`, `any`, `any`\>, {}, {}, `any`, {}, ``"type"``, {}\> |

#### Returns

`void`

#### Defined in

[src/api.ts:199](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L199)

___

### wrapScript

▸ **wrapScript**(`func`, `options?`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `func` | () => `Promise`<`any`\> |
| `options` | [`WrapScriptOptions`](interfaces/WrapScriptOptions.md) |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/expressServer.ts:250](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/expressServer.ts#L250)
