// Defaults closed
import * as Sentry from "@sentry/node";
import express, {NextFunction} from "express";
import mongoose, {Model} from "mongoose";

import {addPopulateToQuery, FernsRouterOptions, getModel, RESTMethod} from "./api";
import {User} from "./auth";
import {APIError} from "./errors";
import {logger} from "./logger";

export type PermissionMethod<T> = (
  method: RESTMethod,
  user?: User,
  obj?: T
) => boolean | Promise<boolean>;

export interface RESTPermissions<T> {
  create: PermissionMethod<T>[];
  list: PermissionMethod<T>[];
  read: PermissionMethod<T>[];
  update: PermissionMethod<T>[];
  delete: PermissionMethod<T>[];
}

export const OwnerQueryFilter = (user?: User) => {
  if (user) {
    return {ownerId: user?.id};
  }
  // Return a null, so we know to return no results.
  return null;
};

export const Permissions = {
  IsAuthenticatedOrReadOnly: (method: RESTMethod, user?: User) => {
    if (user?.id && !user?.isAnonymous) {
      return true;
    }
    return method === "list" || method === "read";
  },
  IsOwnerOrReadOnly: (method: RESTMethod, user?: User, obj?: any) => {
    // When checking if we can possibly perform the action, return true.
    if (!obj) {
      return true;
    }
    if (user?.admin) {
      return true;
    }

    if (user?.id && obj?.ownerId && String(obj?.ownerId) === String(user?.id)) {
      return true;
    }
    return method === "list" || method === "read";
  },
  IsAny: () => {
    return true;
  },
  IsOwner: (method: RESTMethod, user?: User, obj?: any) => {
    // When checking if we can possibly perform the action, return true.
    if (!obj) {
      return true;
    }
    if (!user) {
      return false;
    }
    if (user?.admin) {
      return true;
    }
    const ownerId = obj?.ownerId?._id || obj?.ownerId;
    return user?.id && ownerId && String(ownerId) === String(user?.id);
  },
  IsAdmin: (method: RESTMethod, user?: User) => {
    return Boolean(user?.admin);
  },
  IsAuthenticated: (method: RESTMethod, user?: User) => {
    if (!user) {
      return false;
    }
    return Boolean(user.id);
  },
};

export async function checkPermissions<T>(
  method: RESTMethod,
  permissions: PermissionMethod<T>[],
  user?: User,
  obj?: T
): Promise<boolean> {
  let anyTrue = false;
  for (const perm of permissions) {
    // May or may not be a promise.
    if (!(await perm(method, user, obj))) {
      return false;
    } else {
      anyTrue = true;
    }
  }
  return anyTrue;
}

// Check the permissions for a given model and method. If the method is a read, update, or delete,
// finds the relevant object, checks the permissions, and attaches the object to the request as
// req.obj.
export function permissionMiddleware<T>(
  baseModel: Model<T>,
  options: Pick<FernsRouterOptions<T>, "permissions" | "populatePaths" | "discriminatorKey">
) {
  return async (req: express.Request, res: express.Response, next: NextFunction) => {
    if (req.method === "OPTIONS") {
      return next();
    }
    try {
      let method: "list" | "create" | "read" | "update" | "delete";

      const reqMethod = req.method.toLowerCase();
      if (reqMethod === "post") {
        method = "create";
      } else if (reqMethod === "get") {
        if (req.params.id) {
          method = "read";
        } else {
          method = "list";
        }
      } else if (reqMethod === "patch") {
        method = "update";
      } else if (reqMethod === "delete") {
        method = "delete";
      } else {
        throw new APIError({
          status: 405,
          title: `Method ${req.method} not allowed`,
        });
      }

      const model = getModel(baseModel, req.body, options);

      // All methods check for permissions.
      if (!(await checkPermissions(method, options.permissions[method], req.user))) {
        throw new APIError({
          status: 405,
          title:
            `Access to ${method.toUpperCase()} on ${model.modelName} ` +
            `denied for ${req.user?.id}`,
        });
      }

      if (method === "create" || method === "list") {
        return next();
      }

      const builtQuery = model.findById(req.params.id);
      const populatedQuery = addPopulateToQuery(builtQuery as any, options.populatePaths);
      let data;
      try {
        data = await populatedQuery.exec();
      } catch (error: any) {
        throw new APIError({
          status: 500,
          title: `GET failed on ${req.params.id}`,
          error,
        });
      }
      if (!data || (["update", "delete"].includes(method) && data?.__t && !req.body?.__t)) {
        // For discriminated models, return 404 without checking hidden state
        if (["update", "delete"].includes(method) && data?.__t && !req.body?.__t) {
          throw new APIError({
            status: 404,
            title: `Document ${req.params.id} not found for model ${model.modelName}`,
          });
        }

        // Check if document exists but is hidden. Completely skip plugins.
        const hiddenDoc = await model.collection.findOne({
          _id: new mongoose.Types.ObjectId(req.params.id),
        });

        if (!hiddenDoc) {
          Sentry.captureMessage(`Document ${req.params.id} not found for model ${model.modelName}`);
          const error = new APIError({
            status: 404,
            title: `Document ${req.params.id} not found for model ${model.modelName}`,
          });
          delete error.meta;
          throw error;
        }

        // Document exists but is hidden
        const reason: {[key: string]: string} | null = hiddenDoc.deleted
          ? {deleted: "true"}
          : hiddenDoc.disabled
            ? {disabled: "true"}
            : hiddenDoc.archived
              ? {archived: "true"}
              : null;

        // If no reason found, treat as not found
        if (!reason) {
          Sentry.captureMessage(`Document ${req.params.id} not found for model ${model.modelName}`);
          const error = new APIError({
            status: 404,
            title: `Document ${req.params.id} not found for model ${model.modelName}`,
          });
          delete error.meta;
          throw error;
        } else {
          Sentry.captureMessage(
            `Document ${req.params.id} not found, because ${JSON.stringify(reason)} for model ${model.modelName}`
          );
          throw new APIError({
            status: 404,
            title: `Document ${req.params.id} not found for model ${model.modelName}`,
            meta: reason,
          });
        }
      }

      if (!(await checkPermissions(method, options.permissions[method], req.user, data))) {
        throw new APIError({
          status: 403,
          title: `Access to GET on ${model.modelName}:${req.params.id} denied for ${req.user?.id}`,
        });
      }

      (req as any).obj = data;

      return next();
    } catch (error) {
      logger.error(`Permissions error: ${error instanceof Error ? error.message : error}`);
      return next(error);
    }
  };
}
