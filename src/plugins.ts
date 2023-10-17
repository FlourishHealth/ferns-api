import {FilterQuery, Schema} from "mongoose";

import {APIError, APIErrorConstructor} from "./errors";

export interface BaseUser {
  admin: boolean;
  email: string;
}

export function baseUserPlugin(schema: Schema) {
  schema.add({admin: {type: Boolean, default: false}});
  schema.add({email: {type: String, index: true}});
}

/** For models with the isDeletedPlugin, extend this interface to add the appropriate fields. */
export interface IsDeleted {
  // Whether the model should be treated as deleted or not.
  deleted: boolean;
}

export function isDeletedPlugin(schema: Schema, defaultValue = false) {
  schema.add({deleted: {type: Boolean, default: defaultValue, index: true}});
  schema.pre("find", function () {
    const query = this.getQuery();
    if (query && query.deleted === undefined) {
      this.where({deleted: {$ne: true}});
    }
  });
}

export interface CreatedDeleted {
  updated: {type: Date; required: true};
  created: {type: Date; required: true};
}

export function createdUpdatedPlugin(schema: Schema) {
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

  schema.pre("update", function (next) {
    this.updateOne({}, {$set: {updated: new Date()}});
    next();
  });
}

export function firebaseJWTPlugin(schema: Schema) {
  schema.add({firebaseId: {type: String, index: true}});
}

/**
 * This adds a static method `Model.findOneOrThrow` to the schema. This should replace `Model.findOne` in most instances.
 * `Model.findOne` should only be used with a unique index, but that's not apparent from the docs. Otherwise you can wind
 * up with a random document that matches the query. The returns either null if no document matches, the actual
 * document, or throws an exception if multiple are found.
 * @param schema Mongoose Schema
 */
export function findOneOrThrow<T>(schema: Schema) {
  schema.statics.findOneOrThrow = async function (
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
 * This adds a static method `Model.findExactlyOne` to the schema. This or findOneOrThrow should replace `Model.findOne`
 * in most instances.
 * `Model.findOne` should only be used with a unique index, but that's not apparent from the docs. Otherwise you can wind
 * up with a random document that matches the query. The returns the one matching document, or throws an exception if
 * multiple or none are found.
 * @param schema Mongoose Schema
 */
export function findExactlyOne<T>(schema: Schema) {
  schema.statics.findExactlyOne = async function (
    query: FilterQuery<T>,
    errorArgs?: Partial<APIErrorConstructor>
  ): Promise<T | null> {
    const results = await this.find(query);
    if (results.length === 0) {
      throw new APIError({
        status: 500,
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
