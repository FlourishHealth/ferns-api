import jwt from "jsonwebtoken";
import {Schema} from "mongoose";

export function tokenPlugin(schema: Schema) {
  schema.add({token: {type: String, index: true}});
  schema.pre("save", function (next) {
    // Add created when creating the object
    if (!this.token) {
      const tokenOptions: any = {
        expiresIn: "10h",
      };
      if (process.env.TOKEN_EXPIRES_IN) {
        tokenOptions.expiresIn = process.env.TOKEN_EXPIRES_IN;
      }
      if (process.env.TOKEN_ISSUER) {
        tokenOptions.issuer = process.env.TOKEN_ISSUER;
      }

      const secretOrKey = process.env.TOKEN_SECRET;
      if (!secretOrKey) {
        throw new Error(`TOKEN_SECRET must be set in env.`);
      }
      this.token = jwt.sign({id: this._id.toString()}, secretOrKey, tokenOptions);
    }
    // On any save, update the updated field.
    this.updated = new Date();
    next();
  });
}

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
  updated: Date;
  created: Date;
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
    this.update({}, {$set: {updated: new Date()}});
    next();
  });
}

export function firebaseJWTPlugin(schema: Schema) {
  schema.add({firebaseId: {type: String, index: true}});
}
