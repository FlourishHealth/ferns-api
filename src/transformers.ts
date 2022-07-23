import {Document} from "mongoose";

import {GooseRESTOptions} from "./api";
import {User} from "./auth";

export function transform<T>(
  options: GooseRESTOptions<T>,
  data: Partial<T> | Partial<T>[],
  method: "create" | "update",
  user?: User
) {
  if (!options.transformer?.transform) {
    return data;
  }

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
