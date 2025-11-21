import express from "express";
import {Document} from "mongoose";

import {FernsRouterOptions} from "./api";
import {User} from "./auth";
import {APIError} from "./errors";
import {logger} from "./logger";

export interface FernsTransformer<T> {
  // Runs before create or update operations. Allows throwing out fields that the user should be
  // able to write to, modify data, check permissions, etc.
  transform?: (obj: Partial<T>, method: "create" | "update", user?: User) => Partial<T> | undefined;
  // Runs after create/update operations but before data is returned from the API. Serialize fetched
  // data, dropping fields based on user, changing data, etc.
  serialize?: (obj: T, user?: User) => Partial<T> | undefined;
}

function getUserType(user?: User, obj?: any): "anon" | "auth" | "owner" | "admin" {
  if (user?.admin) {
    return "admin";
  }
  if (obj && user && String(obj?.ownerId) === String(user?.id)) {
    return "owner";
  }
  if (user?.id) {
    return "auth";
  }
  return "anon";
}

export function AdminOwnerTransformer<T>(options: {
  // TODO: do something with KeyOf here.
  anonReadFields?: string[];
  authReadFields?: string[];
  ownerReadFields?: string[];
  adminReadFields?: string[];
  anonWriteFields?: string[];
  authWriteFields?: string[];
  ownerWriteFields?: string[];
  adminWriteFields?: string[];
}): FernsTransformer<T> {
  function pickFields(obj: Partial<T>, fields: any[]): Partial<T> {
    const newData: Partial<T> = {};
    for (const field of fields) {
      if (obj[field] !== undefined) {
        newData[field] = obj[field];
      }
    }
    return newData;
  }

  return {
    // TODO: Migrate AdminOwnerTransform to use pre-hooks.
    transform: (obj: Partial<T>, _method: "create" | "update", user?: User) => {
      const userType = getUserType(user, obj);
      let allowedFields: any;
      if (userType === "admin") {
        allowedFields = options.adminWriteFields ?? [];
      } else if (userType === "owner") {
        allowedFields = options.ownerWriteFields ?? [];
      } else if (userType === "auth") {
        allowedFields = options.authWriteFields ?? [];
      } else {
        allowedFields = options.anonWriteFields ?? [];
      }
      const unallowedFields = Object.keys(obj).filter((k) => !allowedFields.includes(k));
      if (unallowedFields.length) {
        throw new Error(
          `User of type ${userType} cannot write fields: ${unallowedFields.join(", ")}`
        );
      }
      return obj;
    },
    serialize: (obj: T, user?: User) => {
      const userType = getUserType(user, obj);
      if (userType === "admin") {
        return pickFields(obj, [...(options.adminReadFields ?? []), "id"]);
      }
      if (userType === "owner") {
        return pickFields(obj, [...(options.ownerReadFields ?? []), "id"]);
      }
      if (userType === "auth") {
        return pickFields(obj, [...(options.authReadFields ?? []), "id"]);
      }
      return pickFields(obj, [...(options.anonReadFields ?? []), "id"]);
    },
  };
}

export function transform<T>(
  options: FernsRouterOptions<T>,
  data: Partial<T> | Partial<T>[],
  method: "create" | "update",
  user?: User
) {
  if (!options.transformer?.transform) {
    return data;
  }

  logger.warn(
    "transform functions are deprecated, use preCreate/preUpdate/preDelete hooks instead"
  );

  // TS doesn't realize this is defined otherwise...
  const transformFn = options.transformer?.transform;

  if (!Array.isArray(data)) {
    return transformFn(data, method, user);
  }
  return data.map((d) => transformFn(d, method, user));
}

export function serialize<T>(
  req: express.Request,
  options: FernsRouterOptions<T>,
  data: (Document<any, any, any> & T) | (Document<any, any, any> & T)[]
) {
  const serializeFn = (serializeData: Document<any, any, any> & T, serializeUser?: User) => {
    const dataObject = serializeData.toObject() as T;
    (dataObject as any).id = serializeData._id;

    // Search for any value that is a Map and transform it to a plain object.
    // Otherwise Express drops the contents.
    for (const key in dataObject) {
      const value = dataObject[key];
      if (value instanceof Map) {
        dataObject[key] = Object.fromEntries(value);
      }
    }

    if (options.transformer?.serialize) {
      return options.transformer?.serialize(dataObject, serializeUser);
    }
    return dataObject;
  };

  if (options.transformer?.serialize) {
    logger.warn(
      "transform.serialize functions are deprecated, use post* hooks and serialize instead"
    );
  }
  if (!Array.isArray(data)) {
    return serializeFn(data, req.user);
  }
  return data.map((d) => serializeFn(d, req.user));
}

/**
 * Default response handler for FernsRouter. Calls toObject on each doc and returns the result,
 * using transformers.serializer if provided.
 */
export async function defaultResponseHandler<T>(
  doc: (Document<any, any, any> & T) | (Document<any, any, any> & T)[] | null,
  method: "list" | "create" | "read" | "update",
  request: express.Request,
  options: FernsRouterOptions<T>
) {
  if (!doc) {
    return null;
  }
  try {
    return serialize(request, options, doc);
  } catch (error: any) {
    throw new APIError({
      status: 400,
      title: `Error serializing ${method} response: ${error.message}`,
      error,
    });
  }
}
