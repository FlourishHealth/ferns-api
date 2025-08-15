import {DateTime} from "luxon";
import {
  Error as MongooseError,
  FilterQuery,
  Query,
  Schema,
  SchemaType,
  SchemaTypeOptions,
} from "mongoose";

import {APIError, APIErrorConstructor} from "./errors";

export interface BaseUser {
  admin: boolean;
  email: string;
}

export function baseUserPlugin(schema: Schema<any, any, any, any>) {
  schema.add({admin: {type: Boolean, default: false}});
  schema.add({email: {type: String, index: true}});
}

/** For models with the isDeletedPlugin, extend this interface to add the appropriate fields. */
export interface IsDeleted {
  // Whether the model should be treated as deleted or not.
  deleted: boolean;
}

export function isDeletedPlugin(schema: Schema<any, any, any, any>, defaultValue = false) {
  schema.add({
    deleted: {
      type: Boolean,
      default: defaultValue,
      index: true,
      description:
        "Deleted objects are not returned in any find() or findOne() by default. " +
        "Add {deleted: true} to find them.",
    },
  });
  function applyDeleteFilter(q: Query<any, any>) {
    const query = q.getQuery();
    if (query && query.deleted === undefined) {
      void q.where({deleted: {$ne: true}});
    }
  }
  schema.pre("find", function () {
    applyDeleteFilter(this);
  });
  schema.pre("findOne", function () {
    applyDeleteFilter(this);
  });
}

export function isDisabledPlugin(schema: Schema<any, any, any, any>, defaultValue = false) {
  schema.add({
    disabled: {
      type: Boolean,
      default: defaultValue,
      index: true,
      description: "When a user is set to disable, all requests will return a 401",
    },
  });
}

export interface CreatedDeleted {
  updated: {type: Date; required: true};
  created: {type: Date; required: true};
}

export function createdUpdatedPlugin(schema: Schema<any, any, any, any>) {
  schema.add({updated: {type: Date, index: true}});
  schema.add({created: {type: Date, index: true}});

  schema.pre("save", function (next) {
    if (this.disableCreatedUpdatedPlugin === true) {
      next();
      return;
    }
    // If we aren't specifying created, use now.
    if (!this.created) {
      this.created = new Date();
    }
    // All writes change the updated time.
    this.updated = new Date();
    next();
  });

  schema.pre(/save|updateOne|insertMany/, function (next) {
    void this.updateOne({}, {$set: {updated: new Date()}});
    next();
  });
}

export function firebaseJWTPlugin(schema: Schema) {
  schema.add({firebaseId: {type: String, index: true}});
}

/**
 * This adds a static method `Model.findOneOrNone` to the schema. This should replace `Model.findOne` in most instances.
 * `Model.findOne` should only be used with a unique index, but that's not apparent from the docs. Otherwise you can wind
 * up with a random document that matches the query. The returns either null if no document matches, the actual
 * document, or throws an exception if multiple are found.
 * @param schema Mongoose Schema
 */
export function findOneOrNone<T>(schema: Schema<any, any, any, any>) {
  schema.statics.findOneOrNone = async function (
    query: FilterQuery<T>,
    errorArgs?: Partial<APIErrorConstructor>
  ): Promise<T | null> {
    const results = await this.find(query);
    if (results.length === 0) {
      return null;
    } else if (results.length > 1) {
      throw new APIError({
        status: 500,
        title: `${this.modelName}.findOne query returned multiple documents`,
        detail: `query: ${JSON.stringify(query)}`,
        ...errorArgs,
      });
    } else {
      return results[0];
    }
  };
}

/**
 * This adds a static method `Model.findExactlyOne` to the schema. This or findOneOrNone should replace `Model.findOne`
 * in most instances.
 * `Model.findOne` should only be used with a unique index, but that's not apparent from the docs. Otherwise you can wind
 * up with a random document that matches the query. The returns the one matching document, or throws an exception if
 * multiple or none are found.
 * @param schema Mongoose Schema
 */
export function findExactlyOne<T>(schema: Schema<any, any, any, any>) {
  schema.statics.findExactlyOne = async function (
    query: FilterQuery<T>,
    errorArgs?: Partial<APIErrorConstructor>
  ): Promise<T | null> {
    const results = await this.find(query);
    if (results.length === 0) {
      throw new APIError({
        status: 404,
        title: `${this.modelName}.findExactlyOne query returned no documents`,
        detail: `query: ${JSON.stringify(query)}`,
        ...errorArgs,
      });
    } else if (results.length > 1) {
      throw new APIError({
        status: 500,
        title: `${this.modelName}.findExactlyOne query returned multiple documents`,
        detail: `query: ${JSON.stringify(query)}`,
        ...errorArgs,
      });
    } else {
      return results[0];
    }
  };
}

/**
 * This adds a static method `Model.upsert` to the schema. This method will either update an existing document
 * that matches the conditions or create a new document if none exists. It throws an error if multiple documents
 * match the conditions to prevent ambiguous updates.
 * @param schema Mongoose Schema
 */
export function upsertPlugin<T>(schema: Schema<any, any, any, any>) {
  schema.statics.upsert = async function (
    conditions: Record<string, any>,
    update: Record<string, any>
  ): Promise<T> {
    // Try to find the document with the given conditions.
    const docs = await this.find(conditions);
    if (docs.length > 1) {
      throw new APIError({
        status: 500,
        title: `${this.modelName}.upsert find query returned multiple documents`,
        detail: `query: ${JSON.stringify(conditions)}`,
      });
    }
    const doc = docs[0];

    if (doc) {
      // If the document exists, update it with the provided update values.
      Object.assign(doc, update);
      return doc.save();
    } else {
      // If the document doesn't exist, create a new one with the combined conditions and update
      // values.
      const combinedData = {...conditions, ...update};
      const newDoc = new this(combinedData);
      return newDoc.save();
    }
  };
}

/** For models with the upsertPlugin, extend this interface to add the upsert static method. */
export interface HasUpsert<T> {
  upsert(conditions: Record<string, any>, update: Record<string, any>): Promise<T>;
}

export class DateOnly extends SchemaType {
  constructor(key: string, options: SchemaTypeOptions<any>) {
    super(key, options, "DateOnly");
  }

  handleSingle(val) {
    return this.cast(val);
  }

  $conditionalHandlers = {
    ...(SchemaType as any).prototype.$conditionalHandlers,
    $gt: this.handleSingle,
    $gte: this.handleSingle,
    $lt: this.handleSingle,
    $lte: this.handleSingle,
  };

  // Based on castForQuery in mongoose/lib/schema/date.js
  // When using $gt, $gte, $lt, $lte, etc, we need to cast the value to a Date
  castForQuery($conditional, val, context): Date | undefined {
    if ($conditional == null) {
      return (this as any).applySetters(val, context);
    }

    const handler = this.$conditionalHandlers[$conditional];

    if (!handler) {
      throw new Error(`Can't use ${$conditional} with DateOnly.`);
    }

    return handler.call(this, val);
  }

  // When either setting a value to a DateOnly or fetching from the DB,
  // we want to strip off the time portion.
  cast(val: any): Date | undefined {
    if (val instanceof Date) {
      const date = DateTime.fromJSDate(val).toUTC().startOf("day");
      if (!date.isValid) {
        throw new MongooseError.CastError(
          "DateOnly",
          val,
          this.path,
          new Error("Value is not a valid date")
        );
      }
      return date.toJSDate();
    } else if (typeof val === "string" || typeof val === "number") {
      const date = DateTime.fromJSDate(new Date(val)).toUTC().startOf("day");
      if (!date.isValid) {
        throw new MongooseError.CastError(
          "DateOnly",
          val,
          this.path,
          new Error("Value is not a valid date")
        );
      }
      return date.toJSDate();
    }
    // Handle $gte, $lte, etc
    if (typeof val === "object") {
      return val;
    }
    throw new MongooseError.CastError(
      "DateOnly",
      val,
      this.path,
      new Error("Value is not a valid date")
    );
  }

  get(val: any): this {
    return (val instanceof Date ? DateTime.fromJSDate(val).startOf("day").toJSDate() : val) as any;
  }
}

// Register the schema type with Mongoose
(Schema.Types as any).DateOnly = DateOnly;
