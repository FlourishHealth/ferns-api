[ferns-api](../README.md) / [Exports](../modules.md) / UserModel

# Interface: UserModel

## Hierarchy

- `Model`<[`User`](User.md)\>

  ↳ **`UserModel`**

## Table of contents

### Constructors

- [constructor](UserModel.md#constructor)

### Properties

- [base](UserModel.md#base)
- [baseModelName](UserModel.md#basemodelname)
- [collection](UserModel.md#collection)
- [db](UserModel.md#db)
- [discriminators](UserModel.md#discriminators)
- [events](UserModel.md#events)
- [modelName](UserModel.md#modelname)
- [schema](UserModel.md#schema)

### Methods

- [$where](UserModel.md#$where)
- [addListener](UserModel.md#addlistener)
- [aggregate](UserModel.md#aggregate)
- [bulkSave](UserModel.md#bulksave)
- [bulkWrite](UserModel.md#bulkwrite)
- [count](UserModel.md#count)
- [countDocuments](UserModel.md#countdocuments)
- [create](UserModel.md#create)
- [createAnonymousUser](UserModel.md#createanonymoususer)
- [createCollection](UserModel.md#createcollection)
- [createIndexes](UserModel.md#createindexes)
- [createStrategy](UserModel.md#createstrategy)
- [deleteMany](UserModel.md#deletemany)
- [deleteOne](UserModel.md#deleteone)
- [deserializeUser](UserModel.md#deserializeuser)
- [diffIndexes](UserModel.md#diffindexes)
- [discriminator](UserModel.md#discriminator)
- [distinct](UserModel.md#distinct)
- [emit](UserModel.md#emit)
- [ensureIndexes](UserModel.md#ensureindexes)
- [estimatedDocumentCount](UserModel.md#estimateddocumentcount)
- [eventNames](UserModel.md#eventnames)
- [exists](UserModel.md#exists)
- [find](UserModel.md#find)
- [findById](UserModel.md#findbyid)
- [findByIdAndDelete](UserModel.md#findbyidanddelete)
- [findByIdAndRemove](UserModel.md#findbyidandremove)
- [findByIdAndUpdate](UserModel.md#findbyidandupdate)
- [findOne](UserModel.md#findone)
- [findOneAndDelete](UserModel.md#findoneanddelete)
- [findOneAndRemove](UserModel.md#findoneandremove)
- [findOneAndReplace](UserModel.md#findoneandreplace)
- [findOneAndUpdate](UserModel.md#findoneandupdate)
- [geoSearch](UserModel.md#geosearch)
- [getMaxListeners](UserModel.md#getmaxlisteners)
- [hydrate](UserModel.md#hydrate)
- [init](UserModel.md#init)
- [insertMany](UserModel.md#insertmany)
- [listIndexes](UserModel.md#listindexes)
- [listenerCount](UserModel.md#listenercount)
- [listeners](UserModel.md#listeners)
- [mapReduce](UserModel.md#mapreduce)
- [off](UserModel.md#off)
- [on](UserModel.md#on)
- [once](UserModel.md#once)
- [populate](UserModel.md#populate)
- [postCreate](UserModel.md#postcreate)
- [prependListener](UserModel.md#prependlistener)
- [prependOnceListener](UserModel.md#prependoncelistener)
- [rawListeners](UserModel.md#rawlisteners)
- [remove](UserModel.md#remove)
- [removeAllListeners](UserModel.md#removealllisteners)
- [removeListener](UserModel.md#removelistener)
- [replaceOne](UserModel.md#replaceone)
- [serializeUser](UserModel.md#serializeuser)
- [setMaxListeners](UserModel.md#setmaxlisteners)
- [startSession](UserModel.md#startsession)
- [syncIndexes](UserModel.md#syncindexes)
- [translateAliases](UserModel.md#translatealiases)
- [update](UserModel.md#update)
- [updateMany](UserModel.md#updatemany)
- [updateOne](UserModel.md#updateone)
- [validate](UserModel.md#validate)
- [watch](UserModel.md#watch)
- [where](UserModel.md#where)

## Constructors

### constructor

• **new UserModel**<`DocType`\>(`doc?`, `fields?`, `options?`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocType` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc?` | `DocType` |
| `fields?` | `any` |
| `options?` | `boolean` \| `AnyObject` |

#### Inherited from

Model<User\>.constructor

#### Defined in

node_modules/mongoose/types/models.d.ts:122

## Properties

### base

• **base**: `__module`

#### Inherited from

Model.base

#### Defined in

node_modules/mongoose/types/models.d.ts:128

___

### baseModelName

• **baseModelName**: `undefined` \| `string`

#### Inherited from

Model.baseModelName

#### Defined in

node_modules/mongoose/types/models.d.ts:134

___

### collection

• **collection**: `Collection`<`Document`\>

#### Inherited from

Model.collection

#### Defined in

node_modules/mongoose/types/models.d.ts:155

___

### db

• **db**: `Connection`

#### Inherited from

Model.db

#### Defined in

node_modules/mongoose/types/models.d.ts:182

___

### discriminators

• **discriminators**: `undefined` \| { `[name: string]`: `Model`<`any`\>;  }

#### Inherited from

Model.discriminators

#### Defined in

node_modules/mongoose/types/models.d.ts:297

___

### events

• **events**: `EventEmitter`

#### Inherited from

Model.events

#### Defined in

node_modules/mongoose/types/models.d.ts:206

___

### modelName

• **modelName**: `string`

#### Inherited from

Model.modelName

#### Defined in

node_modules/mongoose/types/models.d.ts:276

___

### schema

• **schema**: `Schema`<[`User`](User.md), `Model`<[`User`](User.md), `any`, `any`, `any`, `any`\>, {}, {}, `any`, {}, ``"type"``, [`User`](User.md)\>

#### Inherited from

Model.schema

#### Defined in

node_modules/mongoose/types/models.d.ts:400

## Methods

### $where

▸ **$where**(`argument`): `Query`<(`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  })[], `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `argument` | `string` \| `Function` |

#### Returns

`Query`<(`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  })[], `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.$where

#### Defined in

node_modules/mongoose/types/models.d.ts:294

___

### addListener

▸ **addListener**(`eventName`, `listener`): [`UserModel`](UserModel.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`UserModel`](UserModel.md)

#### Inherited from

Model.addListener

#### Defined in

node_modules/@types/node/events.d.ts:317

___

### aggregate

▸ **aggregate**<`R`\>(`pipeline?`, `options?`, `callback?`): `Aggregate`<`R`[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `R` | `any` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `pipeline?` | `PipelineStage`[] |
| `options?` | `AggregateOptions` |
| `callback?` | `Callback`<`R`[]\> |

#### Returns

`Aggregate`<`R`[]\>

#### Inherited from

Model.aggregate

#### Defined in

node_modules/mongoose/types/models.d.ts:124

▸ **aggregate**<`R`\>(`pipeline`, `callback?`): `Aggregate`<`R`[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `R` | `any` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `pipeline` | `PipelineStage`[] |
| `callback?` | `Callback`<`R`[]\> |

#### Returns

`Aggregate`<`R`[]\>

#### Inherited from

Model.aggregate

#### Defined in

node_modules/mongoose/types/models.d.ts:125

___

### bulkSave

▸ **bulkSave**(`documents`, `options?`): `Promise`<`BulkWriteResult`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `documents` | `Document`<`any`, `any`, `any`\>[] |
| `options?` | `BulkWriteOptions` |

#### Returns

`Promise`<`BulkWriteResult`\>

#### Inherited from

Model.bulkSave

#### Defined in

node_modules/mongoose/types/models.d.ts:152

___

### bulkWrite

▸ **bulkWrite**(`writes`, `options`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `writes` | `AnyBulkWriteOperation`<`Document`\>[] |
| `options` | `BulkWriteOptions` & `MongooseBulkWriteOptions` |
| `callback` | `Callback`<`BulkWriteResult`\> |

#### Returns

`void`

#### Inherited from

Model.bulkWrite

#### Defined in

node_modules/mongoose/types/models.d.ts:143

▸ **bulkWrite**(`writes`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `writes` | `AnyBulkWriteOperation`<`Document`\>[] |
| `callback` | `Callback`<`BulkWriteResult`\> |

#### Returns

`void`

#### Inherited from

Model.bulkWrite

#### Defined in

node_modules/mongoose/types/models.d.ts:144

▸ **bulkWrite**(`writes`, `options?`): `Promise`<`BulkWriteResult`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `writes` | `AnyBulkWriteOperation`<`Document`\>[] |
| `options?` | `BulkWriteOptions` & `MongooseBulkWriteOptions` |

#### Returns

`Promise`<`BulkWriteResult`\>

#### Inherited from

Model.bulkWrite

#### Defined in

node_modules/mongoose/types/models.d.ts:145

___

### count

▸ **count**(`callback?`): `Query`<`number`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `Callback`<`number`\> |

#### Returns

`Query`<`number`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.count

#### Defined in

node_modules/mongoose/types/models.d.ts:158

▸ **count**(`filter`, `callback?`): `Query`<`number`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `callback?` | `Callback`<`number`\> |

#### Returns

`Query`<`number`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.count

#### Defined in

node_modules/mongoose/types/models.d.ts:159

___

### countDocuments

▸ **countDocuments**(`filter`, `options?`, `callback?`): `Query`<`number`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `options?` | `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `Callback`<`number`\> |

#### Returns

`Query`<`number`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.countDocuments

#### Defined in

node_modules/mongoose/types/models.d.ts:162

▸ **countDocuments**(`callback?`): `Query`<`number`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `Callback`<`number`\> |

#### Returns

`Query`<`number`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.countDocuments

#### Defined in

node_modules/mongoose/types/models.d.ts:163

___

### create

▸ **create**<`DocContents`\>(`docs`, `options?`): `Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `docs` | ([`User`](User.md) \| `DocContents`)[] |
| `options?` | `SaveOptions` |

#### Returns

`Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\>

#### Inherited from

Model.create

#### Defined in

node_modules/mongoose/types/models.d.ts:166

▸ **create**<`DocContents`\>(`docs`, `callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `docs` | ([`User`](User.md) \| `DocContents`)[] |
| `callback` | `Callback`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\> |

#### Returns

`void`

#### Inherited from

Model.create

#### Defined in

node_modules/mongoose/types/models.d.ts:167

▸ **create**<`DocContents`\>(`doc`): `Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | [`User`](User.md) \| `DocContents` |

#### Returns

`Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>\>

#### Inherited from

Model.create

#### Defined in

node_modules/mongoose/types/models.d.ts:168

▸ **create**<`DocContents`\>(...`docs`): `Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `...docs` | ([`User`](User.md) \| `DocContents`)[] |

#### Returns

`Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\>

#### Inherited from

Model.create

#### Defined in

node_modules/mongoose/types/models.d.ts:169

▸ **create**<`DocContents`\>(`doc`, `callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | [`User`](User.md) \| `DocContents` |
| `callback` | `Callback`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>\> |

#### Returns

`void`

#### Inherited from

Model.create

#### Defined in

node_modules/mongoose/types/models.d.ts:170

___

### createAnonymousUser

▸ `Optional` **createAnonymousUser**(`id?`): `Promise`<[`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `id?` | `string` |

#### Returns

`Promise`<[`User`](User.md)\>

#### Defined in

[src/api.ts:68](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L68)

___

### createCollection

▸ **createCollection**<`T`\>(`options`, `callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Document` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | ``null`` \| `CreateCollectionOptions` & `Pick`<`SchemaOptions`<``"type"``, `unknown`, {}, {}, {}, {}\>, ``"expires"``\> |
| `callback` | `Callback`<`Collection`<`T`\>\> |

#### Returns

`void`

#### Inherited from

Model.createCollection

#### Defined in

node_modules/mongoose/types/models.d.ts:177

▸ **createCollection**<`T`\>(`callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Document` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `Callback`<`Collection`<`T`\>\> |

#### Returns

`void`

#### Inherited from

Model.createCollection

#### Defined in

node_modules/mongoose/types/models.d.ts:178

▸ **createCollection**<`T`\>(`options?`): `Promise`<`Collection`<`T`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Document` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `CreateCollectionOptions` & `Pick`<`SchemaOptions`<``"type"``, `unknown`, {}, {}, {}, {}\>, ``"expires"``\> |

#### Returns

`Promise`<`Collection`<`T`\>\>

#### Inherited from

Model.createCollection

#### Defined in

node_modules/mongoose/types/models.d.ts:179

___

### createIndexes

▸ **createIndexes**(`options`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `CreateIndexesOptions` |
| `callback` | `CallbackWithoutResult` |

#### Returns

`void`

#### Inherited from

Model.createIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:18

▸ **createIndexes**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `CallbackWithoutResult` |

#### Returns

`void`

#### Inherited from

Model.createIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:19

▸ **createIndexes**(`options?`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `CreateIndexesOptions` |

#### Returns

`Promise`<`void`\>

#### Inherited from

Model.createIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:20

___

### createStrategy

▸ **createStrategy**(): `any`

#### Returns

`any`

#### Defined in

[src/api.ts:71](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L71)

___

### deleteMany

▸ **deleteMany**(`filter?`, `options?`, `callback?`): `Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `options?` | `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `CallbackWithoutResult` |

#### Returns

`Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.deleteMany

#### Defined in

node_modules/mongoose/types/models.d.ts:189

▸ **deleteMany**(`filter`, `callback`): `Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `callback` | `CallbackWithoutResult` |

#### Returns

`Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.deleteMany

#### Defined in

node_modules/mongoose/types/models.d.ts:190

▸ **deleteMany**(`callback`): `Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `CallbackWithoutResult` |

#### Returns

`Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.deleteMany

#### Defined in

node_modules/mongoose/types/models.d.ts:191

___

### deleteOne

▸ **deleteOne**(`filter?`, `options?`, `callback?`): `Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `options?` | `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `CallbackWithoutResult` |

#### Returns

`Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.deleteOne

#### Defined in

node_modules/mongoose/types/models.d.ts:198

▸ **deleteOne**(`filter`, `callback`): `Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `callback` | `CallbackWithoutResult` |

#### Returns

`Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.deleteOne

#### Defined in

node_modules/mongoose/types/models.d.ts:199

▸ **deleteOne**(`callback`): `Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `CallbackWithoutResult` |

#### Returns

`Query`<`DeleteResult`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.deleteOne

#### Defined in

node_modules/mongoose/types/models.d.ts:200

___

### deserializeUser

▸ **deserializeUser**(): `any`

#### Returns

`any`

#### Defined in

[src/api.ts:76](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L76)

___

### diffIndexes

▸ **diffIndexes**(`options`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | ``null`` \| `Record`<`string`, `unknown`\> |
| `callback` | `Callback`<`IndexesDiff`\> |

#### Returns

`void`

#### Inherited from

Model.diffIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:27

▸ **diffIndexes**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `Callback`<`IndexesDiff`\> |

#### Returns

`void`

#### Inherited from

Model.diffIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:28

▸ **diffIndexes**(`options?`): `Promise`<`IndexesDiff`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `Record`<`string`, `unknown`\> |

#### Returns

`Promise`<`IndexesDiff`\>

#### Inherited from

Model.diffIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:29

___

### discriminator

▸ **discriminator**<`D`\>(`name`, `schema`, `value?`): `Model`<`D`, {}, {}, {}, `any`\>

#### Type parameters

| Name |
| :------ |
| `D` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `ProjectionElementType` |
| `schema` | `Schema`<`any`, `Model`<`any`, `any`, `any`, `any`, `any`\>, {}, {}, `any`, {}, ``"type"``, {}\> |
| `value?` | `string` \| `number` \| `ObjectId` |

#### Returns

`Model`<`D`, {}, {}, {}, `any`\>

#### Inherited from

Model.discriminator

#### Defined in

node_modules/mongoose/types/models.d.ts:6

▸ **discriminator**<`T`, `U`\>(`name`, `schema`, `value?`): `U`

#### Type parameters

| Name |
| :------ |
| `T` |
| `U` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `ProjectionElementType` |
| `schema` | `Schema`<`T`, `U`, {}, {}, `any`, {}, ``"type"``, `ObtainDocumentType`<`any`, `T`, ``"type"``\>\> |
| `value?` | `string` \| `number` \| `ObjectId` |

#### Returns

`U`

#### Inherited from

Model.discriminator

#### Defined in

node_modules/mongoose/types/models.d.ts:7

___

### distinct

▸ **distinct**<`ReturnType`\>(`field`, `filter?`, `callback?`): `Query`<`ReturnType`[], `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ReturnType` | `any` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `field` | `string` |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `callback?` | `Callback`<`number`\> |

#### Returns

`Query`<`ReturnType`[], `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.distinct

#### Defined in

node_modules/mongoose/types/models.d.ts:303

___

### emit

▸ **emit**(`eventName`, ...`args`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `...args` | `any`[] |

#### Returns

`boolean`

#### Inherited from

Model.emit

#### Defined in

node_modules/@types/node/events.d.ts:573

___

### ensureIndexes

▸ **ensureIndexes**(`options`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `CreateIndexesOptions` |
| `callback` | `CallbackWithoutResult` |

#### Returns

`void`

#### Inherited from

Model.ensureIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:35

▸ **ensureIndexes**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `CallbackWithoutResult` |

#### Returns

`void`

#### Inherited from

Model.ensureIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:36

▸ **ensureIndexes**(`options?`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `CreateIndexesOptions` |

#### Returns

`Promise`<`void`\>

#### Inherited from

Model.ensureIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:37

___

### estimatedDocumentCount

▸ **estimatedDocumentCount**(`options?`, `callback?`): `Query`<`number`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `Callback`<`number`\> |

#### Returns

`Query`<`number`, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.estimatedDocumentCount

#### Defined in

node_modules/mongoose/types/models.d.ts:306

___

### eventNames

▸ **eventNames**(): (`string` \| `symbol`)[]

#### Returns

(`string` \| `symbol`)[]

#### Inherited from

Model.eventNames

#### Defined in

node_modules/@types/node/events.d.ts:632

___

### exists

▸ **exists**(`filter`, `callback`): `Query`<``null`` \| `Pick`<`Document`<[`User`](User.md), `any`, `any`\>, ``"_id"``\>, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `callback` | `Callback`<``null`` \| `Pick`<`Document`<[`User`](User.md), `any`, `any`\>, ``"_id"``\>\> |

#### Returns

`Query`<``null`` \| `Pick`<`Document`<[`User`](User.md), `any`, `any`\>, ``"_id"``\>, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.exists

#### Defined in

node_modules/mongoose/types/models.d.ts:312

▸ **exists**(`filter`): `Query`<``null`` \| `Pick`<`Document`<[`User`](User.md), `any`, `any`\>, ``"_id"``\>, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |

#### Returns

`Query`<``null`` \| `Pick`<`Document`<[`User`](User.md), `any`, `any`\>, ``"_id"``\>, `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }, {}, [`User`](User.md)\>

#### Inherited from

Model.exists

#### Defined in

node_modules/mongoose/types/models.d.ts:313

___

### find

▸ **find**<`ResultDoc`\>(`filter`, `projection?`, `options?`, `callback?`): `Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `projection?` | ``null`` \| `string` \| `AnyObject` \| { `_id?`: `string` \| `number` ; `admin?`: `string` \| `number` ; `id?`: `string` \| `number` ; `isAnonymous?`: `string` \| `number` ; `token?`: `string` \| `number`  } |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `Callback`<`ResultDoc`[]\> |

#### Returns

`Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.find

#### Defined in

node_modules/mongoose/types/models.d.ts:316

▸ **find**<`ResultDoc`\>(`filter`, `projection?`, `callback?`): `Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `projection?` | ``null`` \| `string` \| `AnyObject` \| { `_id?`: `string` \| `number` ; `admin?`: `string` \| `number` ; `id?`: `string` \| `number` ; `isAnonymous?`: `string` \| `number` ; `token?`: `string` \| `number`  } |
| `callback?` | `Callback`<`ResultDoc`[]\> |

#### Returns

`Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.find

#### Defined in

node_modules/mongoose/types/models.d.ts:322

▸ **find**<`ResultDoc`\>(`filter`, `callback?`): `Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `callback?` | `Callback`<`ResultDoc`[]\> |

#### Returns

`Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.find

#### Defined in

node_modules/mongoose/types/models.d.ts:327

▸ **find**<`ResultDoc`\>(`callback?`): `Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `Callback`<`ResultDoc`[]\> |

#### Returns

`Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.find

#### Defined in

node_modules/mongoose/types/models.d.ts:331

___

### findById

▸ **findById**<`ResultDoc`\>(`id`, `projection?`, `options?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `any` |
| `projection?` | ``null`` \| `string` \| `AnyObject` \| { `_id?`: `string` \| `number` ; `admin?`: `string` \| `number` ; `id?`: `string` \| `number` ; `isAnonymous?`: `string` \| `number` ; `token?`: `string` \| `number`  } |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `Callback`<``null`` \| `ResultDoc`\> |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findById

#### Defined in

node_modules/mongoose/types/models.d.ts:213

▸ **findById**<`ResultDoc`\>(`id`, `projection?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `any` |
| `projection?` | ``null`` \| `string` \| `AnyObject` \| { `_id?`: `string` \| `number` ; `admin?`: `string` \| `number` ; `id?`: `string` \| `number` ; `isAnonymous?`: `string` \| `number` ; `token?`: `string` \| `number`  } |
| `callback?` | `Callback`<``null`` \| `ResultDoc`\> |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findById

#### Defined in

node_modules/mongoose/types/models.d.ts:219

___

### findByIdAndDelete

▸ **findByIdAndDelete**<`ResultDoc`\>(`id?`, `options?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `id?` | `any` |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `ResultDoc`, `res`: `any`) => `void` |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findByIdAndDelete

#### Defined in

node_modules/mongoose/types/models.d.ts:336

___

### findByIdAndRemove

▸ **findByIdAndRemove**<`ResultDoc`\>(`id?`, `options?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `id?` | `any` |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `ResultDoc`, `res`: `any`) => `void` |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findByIdAndRemove

#### Defined in

node_modules/mongoose/types/models.d.ts:339

___

### findByIdAndUpdate

▸ **findByIdAndUpdate**<`ResultDoc`\>(`id`, `update`, `options`, `callback?`): `Query`<`ModifyResult`<`ResultDoc`\>, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `any` |
| `update` | `UpdateQuery`<[`User`](User.md)\> |
| `options` | `QueryOptions`<[`User`](User.md)\> & { `rawResult`: ``true``  } |
| `callback?` | (`err`: `CallbackError`, `doc`: `any`, `res`: `any`) => `void` |

#### Returns

`Query`<`ModifyResult`<`ResultDoc`\>, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findByIdAndUpdate

#### Defined in

node_modules/mongoose/types/models.d.ts:342

▸ **findByIdAndUpdate**<`ResultDoc`\>(`id`, `update`, `options`, `callback?`): `Query`<`ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `any` |
| `update` | `UpdateQuery`<[`User`](User.md)\> |
| `options` | `QueryOptions`<[`User`](User.md)\> & { `upsert`: ``true``  } & { `new`: ``true``  } \| `QueryOptions`<[`User`](User.md)\> & { `upsert`: ``true``  } & { `returnOriginal`: ``false``  } \| `QueryOptions`<[`User`](User.md)\> & { `upsert`: ``true``  } & { `returnDocument`: ``"after"``  } |
| `callback?` | (`err`: `CallbackError`, `doc`: `ResultDoc`, `res`: `any`) => `void` |

#### Returns

`Query`<`ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findByIdAndUpdate

#### Defined in

node_modules/mongoose/types/models.d.ts:343

▸ **findByIdAndUpdate**<`ResultDoc`\>(`id?`, `update?`, `options?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `id?` | `any` |
| `update?` | `UpdateQuery`<[`User`](User.md)\> |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `ResultDoc`, `res`: `any`) => `void` |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findByIdAndUpdate

#### Defined in

node_modules/mongoose/types/models.d.ts:344

▸ **findByIdAndUpdate**<`ResultDoc`\>(`id`, `update`, `callback`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `any` |
| `update` | `UpdateQuery`<[`User`](User.md)\> |
| `callback` | (`err`: `CallbackError`, `doc`: ``null`` \| `ResultDoc`, `res`: `any`) => `void` |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findByIdAndUpdate

#### Defined in

node_modules/mongoose/types/models.d.ts:345

___

### findOne

▸ **findOne**<`ResultDoc`\>(`filter?`, `projection?`, `options?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `projection?` | ``null`` \| `string` \| `AnyObject` \| { `_id?`: `string` \| `number` ; `admin?`: `string` \| `number` ; `id?`: `string` \| `number` ; `isAnonymous?`: `string` \| `number` ; `token?`: `string` \| `number`  } |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `Callback`<``null`` \| `ResultDoc`\> |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findOne

#### Defined in

node_modules/mongoose/types/models.d.ts:226

▸ **findOne**<`ResultDoc`\>(`filter?`, `projection?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `projection?` | ``null`` \| `string` \| `AnyObject` \| { `_id?`: `string` \| `number` ; `admin?`: `string` \| `number` ; `id?`: `string` \| `number` ; `isAnonymous?`: `string` \| `number` ; `token?`: `string` \| `number`  } |
| `callback?` | `Callback`<``null`` \| `ResultDoc`\> |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findOne

#### Defined in

node_modules/mongoose/types/models.d.ts:232

▸ **findOne**<`ResultDoc`\>(`filter?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `callback?` | `Callback`<``null`` \| `ResultDoc`\> |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findOne

#### Defined in

node_modules/mongoose/types/models.d.ts:237

___

### findOneAndDelete

▸ **findOneAndDelete**<`ResultDoc`\>(`filter?`, `options?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `ResultDoc`, `res`: `any`) => `void` |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findOneAndDelete

#### Defined in

node_modules/mongoose/types/models.d.ts:348

___

### findOneAndRemove

▸ **findOneAndRemove**<`ResultDoc`\>(`filter?`, `options?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `ResultDoc`, `res`: `any`) => `void` |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findOneAndRemove

#### Defined in

node_modules/mongoose/types/models.d.ts:351

___

### findOneAndReplace

▸ **findOneAndReplace**<`ResultDoc`\>(`filter`, `replacement`, `options`, `callback?`): `Query`<`ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `replacement` | [`User`](User.md) \| `AnyObject` |
| `options` | `QueryOptions`<[`User`](User.md)\> & { `upsert`: ``true``  } & { `new`: ``true``  } \| `QueryOptions`<[`User`](User.md)\> & { `upsert`: ``true``  } & { `returnOriginal`: ``false``  } \| `QueryOptions`<[`User`](User.md)\> & { `upsert`: ``true``  } & { `returnDocument`: ``"after"``  } |
| `callback?` | (`err`: `CallbackError`, `doc`: `ResultDoc`, `res`: `any`) => `void` |

#### Returns

`Query`<`ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findOneAndReplace

#### Defined in

node_modules/mongoose/types/models.d.ts:354

▸ **findOneAndReplace**<`ResultDoc`\>(`filter?`, `replacement?`, `options?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `replacement?` | [`User`](User.md) \| `AnyObject` |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| `ResultDoc`, `res`: `any`) => `void` |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findOneAndReplace

#### Defined in

node_modules/mongoose/types/models.d.ts:355

___

### findOneAndUpdate

▸ **findOneAndUpdate**<`ResultDoc`\>(`filter`, `update`, `options`, `callback?`): `Query`<`ModifyResult`<`ResultDoc`\>, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `update` | `UpdateQuery`<[`User`](User.md)\> |
| `options` | `QueryOptions`<[`User`](User.md)\> & { `rawResult`: ``true``  } |
| `callback?` | (`err`: `CallbackError`, `doc`: `any`, `res`: `any`) => `void` |

#### Returns

`Query`<`ModifyResult`<`ResultDoc`\>, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findOneAndUpdate

#### Defined in

node_modules/mongoose/types/models.d.ts:358

▸ **findOneAndUpdate**<`ResultDoc`\>(`filter`, `update`, `options`, `callback?`): `Query`<`ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `_FilterQuery`<[`User`](User.md)\> |
| `update` | `UpdateQuery`<[`User`](User.md)\> |
| `options` | `QueryOptions`<[`User`](User.md)\> & { `upsert`: ``true``  } & { `new`: ``true``  } \| `QueryOptions`<[`User`](User.md)\> & { `upsert`: ``true``  } & { `returnOriginal`: ``false``  } \| `QueryOptions`<[`User`](User.md)\> & { `upsert`: ``true``  } & { `returnDocument`: ``"after"``  } |
| `callback?` | (`err`: `CallbackError`, `doc`: `ResultDoc`, `res`: `any`) => `void` |

#### Returns

`Query`<`ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findOneAndUpdate

#### Defined in

node_modules/mongoose/types/models.d.ts:364

▸ **findOneAndUpdate**<`ResultDoc`\>(`filter?`, `update?`, `options?`, `callback?`): `Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `update?` | `UpdateQuery`<[`User`](User.md)\> |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | (`err`: `CallbackError`, `doc`: ``null`` \| [`User`](User.md), `res`: `any`) => `void` |

#### Returns

`Query`<``null`` \| `ResultDoc`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.findOneAndUpdate

#### Defined in

node_modules/mongoose/types/models.d.ts:370

___

### geoSearch

▸ **geoSearch**<`ResultDoc`\>(`filter?`, `options?`, `callback?`): `Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `options?` | `GeoSearchOptions` |
| `callback?` | `Callback`<`ResultDoc`[]\> |

#### Returns

`Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.geoSearch

#### Defined in

node_modules/mongoose/types/models.d.ts:377

___

### getMaxListeners

▸ **getMaxListeners**(): `number`

#### Returns

`number`

#### Inherited from

Model.getMaxListeners

#### Defined in

node_modules/@types/node/events.d.ts:489

___

### hydrate

▸ **hydrate**(`obj`): `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |

#### Returns

`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }

#### Inherited from

Model.hydrate

#### Defined in

node_modules/mongoose/types/models.d.ts:246

___

### init

▸ **init**(`callback?`): `Promise`<`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `CallbackWithoutResult` |

#### Returns

`Promise`<`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }\>

#### Inherited from

Model.init

#### Defined in

node_modules/mongoose/types/models.d.ts:256

___

### insertMany

▸ **insertMany**<`DocContents`\>(`docs`, `options`, `callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `docs` | ([`User`](User.md) \| `DocContents`)[] |
| `options` | `InsertManyOptions` & { `lean`: ``true``  } |
| `callback` | `Callback`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>[]\> |

#### Returns

`void`

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:259

▸ **insertMany**<`DocContents`\>(`docs`, `options`, `callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `docs` | ([`User`](User.md) \| `DocContents`)[] |
| `options` | `InsertManyOptions` & { `rawResult`: ``true``  } |
| `callback` | `Callback`<`InsertManyResult`<[`User`](User.md)\>\> |

#### Returns

`void`

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:260

▸ **insertMany**<`DocContents`\>(`docs`, `callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `docs` | ([`User`](User.md) \| `DocContents`)[] |
| `callback` | `Callback`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\> |

#### Returns

`void`

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:261

▸ **insertMany**<`DocContents`\>(`doc`, `options`, `callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `DocContents` |
| `options` | `InsertManyOptions` & { `lean`: ``true``  } |
| `callback` | `Callback`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>[]\> |

#### Returns

`void`

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:262

▸ **insertMany**<`DocContents`\>(`doc`, `options`, `callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `DocContents` |
| `options` | `InsertManyOptions` & { `rawResult`: ``true``  } |
| `callback` | `Callback`<`InsertManyResult`<[`User`](User.md)\>\> |

#### Returns

`void`

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:263

▸ **insertMany**<`DocContents`\>(`doc`, `options`, `callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `DocContents` |
| `options` | `InsertManyOptions` & { `lean?`: ``false``  } |
| `callback` | `Callback`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\> |

#### Returns

`void`

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:264

▸ **insertMany**<`DocContents`\>(`doc`, `callback`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `DocContents` |
| `callback` | `Callback`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\> |

#### Returns

`void`

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:265

▸ **insertMany**<`DocContents`\>(`docs`, `options`): `Promise`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `docs` | ([`User`](User.md) \| `DocContents`)[] |
| `options` | `InsertManyOptions` & { `lean`: ``true``  } |

#### Returns

`Promise`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>[]\>

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:267

▸ **insertMany**<`DocContents`\>(`docs`, `options`): `Promise`<`InsertManyResult`<[`User`](User.md)\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `docs` | ([`User`](User.md) \| `DocContents`)[] |
| `options` | `InsertManyOptions` & { `rawResult`: ``true``  } |

#### Returns

`Promise`<`InsertManyResult`<[`User`](User.md)\>\>

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:268

▸ **insertMany**<`DocContents`\>(`docs`): `Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `docs` | ([`User`](User.md) \| `DocContents`)[] |

#### Returns

`Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\>

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:269

▸ **insertMany**<`DocContents`\>(`doc`, `options`): `Promise`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `DocContents` |
| `options` | `InsertManyOptions` & { `lean`: ``true``  } |

#### Returns

`Promise`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>[]\>

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:270

▸ **insertMany**<`DocContents`\>(`doc`, `options`): `Promise`<`InsertManyResult`<[`User`](User.md)\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `DocContents` |
| `options` | `InsertManyOptions` & { `rawResult`: ``true``  } |

#### Returns

`Promise`<`InsertManyResult`<[`User`](User.md)\>\>

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:271

▸ **insertMany**<`DocContents`\>(`doc`, `options`): `Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `DocContents` |
| `options` | `InsertManyOptions` |

#### Returns

`Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\>

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:272

▸ **insertMany**<`DocContents`\>(`doc`): `Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `DocContents` | [`User`](User.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `DocContents` |

#### Returns

`Promise`<`HydratedDocument`<`MergeType`<`MergeType`<[`User`](User.md), `DocContents`\>, `Required`<{ `_id`: `string` \| `ObjectId`  }\>\>, {}, {}\>[]\>

#### Inherited from

Model.insertMany

#### Defined in

node_modules/mongoose/types/models.d.ts:273

___

### listIndexes

▸ **listIndexes**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `Callback`<`any`[]\> |

#### Returns

`void`

#### Inherited from

Model.listIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:45

▸ **listIndexes**(): `Promise`<`any`[]\>

#### Returns

`Promise`<`any`[]\>

#### Inherited from

Model.listIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:46

___

### listenerCount

▸ **listenerCount**(`eventName`): `number`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` |  |

#### Returns

`number`

#### Inherited from

Model.listenerCount

#### Defined in

node_modules/@types/node/events.d.ts:579

___

### listeners

▸ **listeners**(`eventName`): `Function`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

#### Inherited from

Model.listeners

#### Defined in

node_modules/@types/node/events.d.ts:502

___

### mapReduce

▸ **mapReduce**<`Key`, `Value`\>(`o`, `callback?`): `Promise`<`any`\>

#### Type parameters

| Name |
| :------ |
| `Key` |
| `Value` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `o` | `MapReduceOptions`<[`User`](User.md), `Key`, `Value`\> |
| `callback?` | `Callback`<`any`\> |

#### Returns

`Promise`<`any`\>

#### Inherited from

Model.mapReduce

#### Defined in

node_modules/mongoose/types/models.d.ts:384

___

### off

▸ **off**(`eventName`, `listener`): [`UserModel`](UserModel.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`UserModel`](UserModel.md)

#### Inherited from

Model.off

#### Defined in

node_modules/@types/node/events.d.ts:462

___

### on

▸ **on**(`eventName`, `listener`): [`UserModel`](UserModel.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` |  |
| `listener` | (...`args`: `any`[]) => `void` |  |

#### Returns

[`UserModel`](UserModel.md)

#### Inherited from

Model.on

#### Defined in

node_modules/@types/node/events.d.ts:348

___

### once

▸ **once**(`eventName`, `listener`): [`UserModel`](UserModel.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` |  |
| `listener` | (...`args`: `any`[]) => `void` |  |

#### Returns

[`UserModel`](UserModel.md)

#### Inherited from

Model.once

#### Defined in

node_modules/@types/node/events.d.ts:377

___

### populate

▸ **populate**(`docs`, `options`, `callback?`): `Promise`<(`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  })[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `docs` | `any`[] |
| `options` | `string` \| `PopulateOptions` \| `PopulateOptions`[] |
| `callback?` | `Callback`<(`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  })[]\> |

#### Returns

`Promise`<(`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  })[]\>

#### Inherited from

Model.populate

#### Defined in

node_modules/mongoose/types/models.d.ts:279

▸ **populate**(`doc`, `options`, `callback?`): `Promise`<`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `any` |
| `options` | `string` \| `PopulateOptions` \| `PopulateOptions`[] |
| `callback?` | `Callback`<`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }\> |

#### Returns

`Promise`<`Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  }\>

#### Inherited from

Model.populate

#### Defined in

node_modules/mongoose/types/models.d.ts:281

___

### postCreate

▸ `Optional` **postCreate**(`body`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | `any` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/api.ts:69](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L69)

___

### prependListener

▸ **prependListener**(`eventName`, `listener`): [`UserModel`](UserModel.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` |  |
| `listener` | (...`args`: `any`[]) => `void` |  |

#### Returns

[`UserModel`](UserModel.md)

#### Inherited from

Model.prependListener

#### Defined in

node_modules/@types/node/events.d.ts:597

___

### prependOnceListener

▸ **prependOnceListener**(`eventName`, `listener`): [`UserModel`](UserModel.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` |  |
| `listener` | (...`args`: `any`[]) => `void` |  |

#### Returns

[`UserModel`](UserModel.md)

#### Inherited from

Model.prependOnceListener

#### Defined in

node_modules/@types/node/events.d.ts:613

___

### rawListeners

▸ **rawListeners**(`eventName`): `Function`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

#### Inherited from

Model.rawListeners

#### Defined in

node_modules/@types/node/events.d.ts:532

___

### remove

▸ **remove**<`ResultDoc`\>(`filter?`, `callback?`): `Query`<`any`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `any` |
| `callback?` | `CallbackWithoutResult` |

#### Returns

`Query`<`any`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.remove

#### Defined in

node_modules/mongoose/types/models.d.ts:389

___

### removeAllListeners

▸ **removeAllListeners**(`event?`): [`UserModel`](UserModel.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `string` \| `symbol` |

#### Returns

[`UserModel`](UserModel.md)

#### Inherited from

Model.removeAllListeners

#### Defined in

node_modules/@types/node/events.d.ts:473

___

### removeListener

▸ **removeListener**(`eventName`, `listener`): [`UserModel`](UserModel.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`UserModel`](UserModel.md)

#### Inherited from

Model.removeListener

#### Defined in

node_modules/@types/node/events.d.ts:457

___

### replaceOne

▸ **replaceOne**<`ResultDoc`\>(`filter?`, `replacement?`, `options?`, `callback?`): `Query`<`any`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `replacement?` | [`User`](User.md) \| `AnyObject` |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `Callback`<`any`\> |

#### Returns

`Query`<`any`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.replaceOne

#### Defined in

node_modules/mongoose/types/models.d.ts:392

___

### serializeUser

▸ **serializeUser**(): `any`

#### Returns

`any`

#### Defined in

[src/api.ts:73](https://github.com/FlourishHealth/ferns-api/blob/5067458/src/api.ts#L73)

___

### setMaxListeners

▸ **setMaxListeners**(`n`): [`UserModel`](UserModel.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `n` | `number` |

#### Returns

[`UserModel`](UserModel.md)

#### Inherited from

Model.setMaxListeners

#### Defined in

node_modules/@types/node/events.d.ts:483

___

### startSession

▸ **startSession**(`options`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `undefined` \| ``null`` \| `ClientSessionOptions` |
| `callback` | `Callback`<`ClientSession`\> |

#### Returns

`void`

#### Inherited from

Model.startSession

#### Defined in

node_modules/mongoose/types/session.d.ts:28

▸ **startSession**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `Callback`<`ClientSession`\> |

#### Returns

`void`

#### Inherited from

Model.startSession

#### Defined in

node_modules/mongoose/types/session.d.ts:29

▸ **startSession**(`options?`): `Promise`<`ClientSession`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `ClientSessionOptions` |

#### Returns

`Promise`<`ClientSession`\>

#### Inherited from

Model.startSession

#### Defined in

node_modules/mongoose/types/session.d.ts:30

___

### syncIndexes

▸ **syncIndexes**(`options`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | ``null`` \| `CreateIndexesOptions` |
| `callback` | `Callback`<`string`[]\> |

#### Returns

`void`

#### Inherited from

Model.syncIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:54

▸ **syncIndexes**(`options?`): `Promise`<`string`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `CreateIndexesOptions` |

#### Returns

`Promise`<`string`[]\>

#### Inherited from

Model.syncIndexes

#### Defined in

node_modules/mongoose/types/indexes.d.ts:55

___

### translateAliases

▸ **translateAliases**(`raw`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `raw` | `any` |

#### Returns

`any`

#### Inherited from

Model.translateAliases

#### Defined in

node_modules/mongoose/types/models.d.ts:300

___

### update

▸ **update**<`ResultDoc`\>(`filter?`, `update?`, `options?`, `callback?`): `Query`<`UpdateResult`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `update?` | `UpdateQuery`<[`User`](User.md)\> \| `UpdateWithAggregationPipeline` |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `Callback`<`any`\> |

#### Returns

`Query`<`UpdateResult`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.update

#### Defined in

node_modules/mongoose/types/models.d.ts:406

___

### updateMany

▸ **updateMany**<`ResultDoc`\>(`filter?`, `update?`, `options?`, `callback?`): `Query`<`UpdateResult`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `update?` | `UpdateQuery`<[`User`](User.md)\> \| `UpdateWithAggregationPipeline` |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `Callback`<`any`\> |

#### Returns

`Query`<`UpdateResult`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.updateMany

#### Defined in

node_modules/mongoose/types/models.d.ts:414

___

### updateOne

▸ **updateOne**<`ResultDoc`\>(`filter?`, `update?`, `options?`, `callback?`): `Query`<`UpdateResult`, `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter?` | `_FilterQuery`<[`User`](User.md)\> |
| `update?` | `UpdateQuery`<[`User`](User.md)\> \| `UpdateWithAggregationPipeline` |
| `options?` | ``null`` \| `QueryOptions`<[`User`](User.md)\> |
| `callback?` | `Callback`<`any`\> |

#### Returns

`Query`<`UpdateResult`, `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.updateOne

#### Defined in

node_modules/mongoose/types/models.d.ts:422

___

### validate

▸ **validate**(`callback?`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback?` | `CallbackWithoutResult` |

#### Returns

`Promise`<`void`\>

#### Inherited from

Model.validate

#### Defined in

node_modules/mongoose/types/models.d.ts:286

▸ **validate**(`optional`, `callback?`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `optional` | `any` |
| `callback?` | `CallbackWithoutResult` |

#### Returns

`Promise`<`void`\>

#### Inherited from

Model.validate

#### Defined in

node_modules/mongoose/types/models.d.ts:287

▸ **validate**(`optional`, `pathsToValidate`, `callback?`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `optional` | `any` |
| `pathsToValidate` | `PathsToValidate` |
| `callback?` | `CallbackWithoutResult` |

#### Returns

`Promise`<`void`\>

#### Inherited from

Model.validate

#### Defined in

node_modules/mongoose/types/models.d.ts:288

___

### watch

▸ **watch**<`ResultType`\>(`pipeline?`, `options?`): `ChangeStream`<`ResultType`, `ChangeStreamDocument`<`ResultType`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultType` | extends `Document` = `any` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `pipeline?` | `Record`<`string`, `unknown`\>[] |
| `options?` | `ChangeStreamOptions` |

#### Returns

`ChangeStream`<`ResultType`, `ChangeStreamDocument`<`ResultType`\>\>

#### Inherited from

Model.watch

#### Defined in

node_modules/mongoose/types/models.d.ts:291

___

### where

▸ **where**<`ResultDoc`\>(`path`, `val?`): `Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `val?` | `any` |

#### Returns

`Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.where

#### Defined in

node_modules/mongoose/types/models.d.ts:430

▸ **where**<`ResultDoc`\>(`obj`): `Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `object` |

#### Returns

`Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.where

#### Defined in

node_modules/mongoose/types/models.d.ts:431

▸ **where**<`ResultDoc`\>(): `Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ResultDoc` | `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `string`  } & [`User`](User.md) & { `_id`: `ObjectId`  } \| `Document`<`unknown`, `any`, [`User`](User.md)\> & { `_id?`: `ObjectId`  } & [`User`](User.md) & { `_id`: `ObjectId`  } |

#### Returns

`Query`<`ResultDoc`[], `ResultDoc`, {}, [`User`](User.md)\>

#### Inherited from

Model.where

#### Defined in

node_modules/mongoose/types/models.d.ts:432
