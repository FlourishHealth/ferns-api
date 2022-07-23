import {Document} from "mongoose";

import {GooseRESTOptions} from "./api";
import {User} from "./auth";
import {logger} from "./logger";

export interface GooseTransformer<T> {
  // Runs before create or update operations. Allows throwing out fields that the user should be
  // able to write to, modify data, check permissions, etc.
  transform?: (obj: Partial<T>, method: "create" | "update", user?: User) => Partial<T> | undefined;
  // Runs after create/update operations but before data is returned from the API. Serialize fetched
  // data, dropping fields based on user, changing data, etc.
  serialize?: (obj: T, user?: User) => Partial<T> | undefined;
}

export function transform<T>(
  options: GooseRESTOptions<T>,
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
  } else {
    return data.map((d) => transformFn(d, method, user));
  }
}

export function serialize<T>(
  options: GooseRESTOptions<T>,
  data: Document<T, {}, {}> | Document<T, {}, {}>[],
  user?: User
) {
  const serializeFn = (serializeData: Document<T, {}, {}>, seralizeUser?: User) => {
    const dataObject = serializeData.toObject() as T;
    (dataObject as any).id = serializeData._id;

    if (options.transformer?.serialize) {
      return options.transformer?.serialize(dataObject, seralizeUser);
    } else {
      return dataObject;
    }
  };

  if (!Array.isArray(data)) {
    return serializeFn(data, user);
  } else {
    return data.map((d) => serializeFn(d, user));
  }
}
