/**
 * This is the doc comment for api.ts
 *
 * @packageDocumentation
 */
import express, {NextFunction, Request, Response} from "express";
import mongoose, {Document, Model} from "mongoose";

import {authenticateMiddleware, getUserType, User} from "./auth";
import {APIError, getAPIErrorBody, isAPIError} from "./errors";
import {logger} from "./logger";
import {checkPermissions, RESTPermissions} from "./permissions";
import {serialize, transform} from "./transformers";
import {isValidObjectId} from "./utils";

// TODOS:
// Support bulk actions
// Support more complex query fields
// Rate limiting

const SPECIAL_QUERY_PARAMS = ["limit", "page"];

/**
 * @param a - the first number
 * @param b - the second number
 * @returns The sum of `a` and `b`
 */
export type RESTMethod = "list" | "create" | "read" | "update" | "delete";

export interface GooseTransformer<T> {
  // Runs before create or update operations. Allows throwing out fields that the user should be
  // able to write to, modify data, check permissions, etc.
  transform?: (obj: Partial<T>, method: "create" | "update", user?: User) => Partial<T> | undefined;
  // Runs after create/update operations but before data is returned from the API. Serialize fetched
  // data, dropping fields based on user, changing data, etc.
  serialize?: (obj: T, user?: User) => Partial<T> | undefined;
}

/**
 * This is the main configuration.
 * @param T - the base document type. This should not include Mongoose models, just the types of the object.
 */
export interface GooseRESTOptions<T> {
  /** A group of method-level (create/read/update/delete/list) permissions. Determine if the user can perform the
   * operation at all, and for read/update/delete methods, whether the user can perform the operation on the object
   * referenced. */
  permissions: RESTPermissions<T>;
  // Query field are cool
  queryFields?: string[];
  // return null to prevent the query from running
  queryFilter?: (user?: User, query?: Record<string, any>) => Record<string, any> | null;
  transformer?: GooseTransformer<T>;
  sort?: string | {[key: string]: "ascending" | "descending"};
  defaultQueryParams?: {[key: string]: any};
  populatePaths?: string[];
  defaultLimit?: number; // defaults to 100
  maxLimit?: number; // defaults to 500
  endpoints?: (router: any) => void;
  preCreate?: (value: any, request: express.Request) => T | Promise<T> | null;
  preUpdate?: (value: any, request: express.Request) => T | Promise<T> | null;
  preDelete?: (value: any, request: express.Request) => T | Promise<T> | null;
  postCreate?: (value: T, request: express.Request) => void | Promise<void>;
  postUpdate?: (value: T, cleanedBody: any, request: express.Request) => void | Promise<void>;
  postDelete?: (request: express.Request) => void | Promise<void>;
  // The discriminatorKey that you passed when creating the Mongoose models. Defaults to __t. See:
  // https://mongoosejs.com/docs/discriminators.html
  discriminatorKey?: string;
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
}): GooseTransformer<T> {
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
    transform: (obj: Partial<T>, method: "create" | "update", user?: User) => {
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
      } else if (userType === "owner") {
        return pickFields(obj, [...(options.ownerReadFields ?? []), "id"]);
      } else if (userType === "auth") {
        return pickFields(obj, [...(options.authReadFields ?? []), "id"]);
      } else {
        return pickFields(obj, [...(options.anonReadFields ?? []), "id"]);
      }
    },
  };
}

// A function to decide which model to use. If no discriminators are provided, just returns the base model. If
function getModel(baseModel: Model<any>, body?: any, options?: GooseRESTOptions<any>) {
  const discriminatorKey = options?.discriminatorKey ?? "__t";
  const modelName = (body ?? {})[discriminatorKey];
  if (!modelName) {
    return baseModel;
  } else {
    const model = (baseModel.discriminators ?? {})[modelName];
    if (!model) {
      throw new Error(
        `Could not find discriminator model for key ${modelName}, baseModel: ${baseModel}`
      );
    }
    return model;
  }
}

/**
 * Create a set of CRUD routes given a Mongoose model $baseModel and configuration options.
 *
 * @param baseModel A Mongoose Model
 * @param options Options for configuring the REST API, such as permissions, transformers, and hooks.
 */
export function gooseRestRouter<T>(
  baseModel: Model<any>,
  options: GooseRESTOptions<T>
): express.Router {
  const router = express.Router();

  // Do before the other router options so endpoints take priority.
  if (options.endpoints) {
    options.endpoints(router);
  }

  // TODO Toggle anonymous auth middleware based on settings for route.
  router.post("/", authenticateMiddleware(true), async (req, res) => {
    const model = getModel(baseModel, req.body?.__t, options);
    if (!(await checkPermissions("create", options.permissions.create, req.user))) {
      logger.warn(`Access to CREATE on ${model.name} denied for ${req.user?.id}`);
      return res.sendStatus(405);
    }

    let body;
    try {
      body = transform<T>(options, req.body, "create", req.user);
    } catch (e) {
      return res.status(403).send({message: (e as any).message});
    }
    if (options.preCreate) {
      try {
        body = await options.preCreate(body, req);
      } catch (e) {
        return res.status(400).send({message: `Pre Create error: ${(e as any).message}`});
      }
      if (body === null) {
        return res.status(403).send({message: "Pre Create returned null"});
      }
    }
    let data;
    try {
      data = await model.create(body);
    } catch (e) {
      return res.status(400).send({message: (e as any).message});
    }
    if (options.postCreate) {
      try {
        await options.postCreate(data, req);
      } catch (e) {
        return res.status(400).send({message: `Post Create error: ${(e as any).message}`});
      }
    }
    // @ts-ignore TS being overprotective of data since we are using generics
    return res.status(201).json({data: serialize<T>(options, data, req.user)});
  });

  // TODO add rate limit
  router.get("/", authenticateMiddleware(true), async (req, res) => {
    // For pure read queries, Mongoose will return the correct data with just the base model.
    const model = baseModel;

    if (!(await checkPermissions("list", options.permissions.list, req.user))) {
      logger.warn(`Access to LIST on ${model.name} denied for ${req.user?.id}`);
      return res.sendStatus(403);
    }

    let query: any = {};
    for (const queryParam of Object.keys(options.defaultQueryParams ?? [])) {
      query[queryParam] = (options.defaultQueryParams ?? {})[queryParam];
    }

    // TODO we can make this much more complicated with ands and ors, but for now, simple queries
    // will do.
    for (const queryParam of Object.keys(req.query)) {
      if ((options.queryFields ?? []).concat(SPECIAL_QUERY_PARAMS).includes(queryParam)) {
        // Not sure if this is necessary or if mongoose does the right thing.
        if (req.query[queryParam] === "true") {
          query[queryParam] = true;
        } else if (req.query[queryParam] === "false") {
          query[queryParam] = false;
        } else {
          query[queryParam] = req.query[queryParam];
        }
      } else {
        logger.debug("Unallowed query param", queryParam);
        return res.status(400).json({message: `${queryParam} is not allowed as a query param.`});
      }
    }

    // Special operators. NOTE: these request Mongo Atlas.
    if (req.query.$search) {
      mongoose.connection.db.collection(model.collection.collectionName);
    }

    if (req.query.$autocomplete) {
      mongoose.connection.db.collection(model.collection.collectionName);
    }

    if (options.queryFilter) {
      let queryFilter;
      try {
        queryFilter = await options.queryFilter(req.user, query);
      } catch (e) {
        return res.status(400).json({message: `Query filter error: ${e}`});
      }

      // If the query filter returns null specifically, we know this is a query that shouldn't
      // return any results.
      if (queryFilter === null) {
        return res.json({data: []});
      }
      query = {...query, ...queryFilter};
    }

    let limit = options.defaultLimit ?? 100;
    if (Number(req.query.limit)) {
      limit = Math.min(Number(req.query.limit), options.maxLimit ?? 500);
    }
    if (query.period) {
      // need to remove 'period' since it isn't part of any schemas but parsed and applied in queryFilter instead
      delete query.period;
    }

    let builtQuery = model.find(query).limit(limit + 1);

    if (req.query.page) {
      if (Number(req.query.page) === 0 || isNaN(Number(req.query.page))) {
        return res.status(400).json({message: `Invalid page: ${req.query.page}`});
      }
      builtQuery = builtQuery.skip((Number(req.query.page) - 1) * limit);
    }

    if (options.sort) {
      builtQuery = builtQuery.sort(options.sort);
    }

    // TODO: we should handle nested serializers here.
    for (const populatePath of options.populatePaths ?? []) {
      builtQuery = builtQuery.populate(populatePath);
    }

    let data: Document<T, {}, {}>[];
    try {
      data = await builtQuery.exec();
    } catch (e) {
      logger.error(`List error: ${(e as any).stack}`);
      return res.sendStatus(500);
    }
    let more;
    try {
      let serialized = serialize<T>(options, data, req.user);
      if (serialized && Array.isArray(serialized)) {
        more = serialized.length === limit + 1 && serialized.length > 0;
        if (more) {
          // Slice off the extra document we fetched to determine if more is true or not.
          serialized = serialized.slice(0, limit);
        }
        return res.json({data: serialized, more, page: req.query.page, limit});
      } else {
        return res.json({data: serialized});
      }
    } catch (e) {
      logger.error("Serialization error", e);
      return res.sendStatus(500);
    }
  });

  router.get("/:id", authenticateMiddleware(true), async (req, res) => {
    // For pure read queries, Mongoose will return the correct data with just the base model.
    const model = baseModel;

    if (!(await checkPermissions("read", options.permissions.read, req.user))) {
      logger.warn(`Access to READ on ${model.name} denied for ${req.user?.id}`);
      return res.sendStatus(405);
    }

    const data = await model.findById(req.params.id);

    if (!data) {
      return res.sendStatus(404);
    }

    if (!(await checkPermissions("read", options.permissions.read, req.user, data))) {
      logger.warn(`Access to READ on ${model.name}:${req.params.id} denied for ${req.user?.id}`);
      return res.sendStatus(403);
    }

    return res.json({data: serialize<T>(options, data, req.user)});
  });

  router.put("/:id", authenticateMiddleware(true), async (req, res) => {
    // Patch is what we want 90% of the time
    return res.sendStatus(500);
  });

  router.patch("/:id", authenticateMiddleware(true), async (req, res) => {
    const model = getModel(baseModel, req.body, options);

    if (!(await checkPermissions("update", options.permissions.update, req.user))) {
      logger.warn(`Access to PATCH on ${model.name} denied for ${req.user?.id}`);
      return res.sendStatus(405);
    }

    const doc = await model.findById(req.params.id);
    // We fail here because we might fetch the document without the __t but we'd be missing all the hooks.
    if (!doc || (doc.__t && !req.body.__t)) {
      logger.warn(`Could not find document to PATCH: ${req.params.id}`);
      return res.sendStatus(404).send();
    }

    if (!(await checkPermissions("update", options.permissions.update, req.user, doc))) {
      logger.warn(`Patch not allowed for user ${req.user?.id} on doc ${doc._id}`);
      return res.sendStatus(403);
    }

    let body;
    try {
      body = transform(options, req.body, "update", req.user);
    } catch (e) {
      logger.warn(
        `PATCH failed on ${req.params.id} for user ${req.user?.id}: ${(e as any).message}`
      );
      return res.status(403).send({message: (e as any).message});
    }

    if (options.preUpdate) {
      try {
        body = await options.preUpdate(body, req);
      } catch (e) {
        logger.warn(`PATCH Pre Update error on ${req.params.id}: ${(e as any).message}`);
        return res
          .status(400)
          .send({message: `PATCH Pre Update error on ${req.params.id}: ${(e as any).message}`});
      }
      if (body === null) {
        logger.warn(`PATCH Pre Update on ${req.params.id} returned null`);
        return res.status(403).send({message: "Pre Update returned null"});
      }
    }

    // Using .save here runs the risk of a versioning error if you try to make two simultaneous updates. We won't
    // wind up with corrupted data, just an API error.
    try {
      Object.assign(doc, body);
      await doc.save();
    } catch (e) {
      logger.warn(`PATCH Pre Update error on ${req.params.id}: ${(e as any).message}`);
      return res.status(400).send({message: (e as any).message});
    }

    if (options.postUpdate) {
      try {
        await options.postUpdate(doc, body, req);
      } catch (e) {
        logger.warn(`PATCH Post Update error on ${req.params.id}: ${(e as any).message}`);
        return res
          .status(400)
          .send({message: `PATCH Post Update error on ${req.params.id}: ${(e as any).message}`});
      }
    }
    return res.json({data: serialize<T>(options, doc, req.user)});
  });

  router.delete("/:id", authenticateMiddleware(true), async (req, res) => {
    const model = getModel(baseModel, req.body, options);
    if (!(await checkPermissions("delete", options.permissions.delete, req.user))) {
      logger.warn(`Access to DELETE on ${model.name} denied for ${req.user?.id}`);
      return res.sendStatus(405);
    }

    const doc = await model.findById(req.params.id);

    // We fail here because we might fetch the document without the __t but we'd be missing all the hooks.
    if (!doc || (doc.__t && !req.body.__t)) {
      logger.warn(`Could not find document to DELETE: ${req.user?.id}`);
      return res.sendStatus(404);
    }

    if (!(await checkPermissions("delete", options.permissions.delete, req.user, doc))) {
      logger.warn(`Access to DELETE on ${model.name}:${req.params.id} denied for ${req.user?.id}`);
      return res.sendStatus(403);
    }

    if (options.preDelete) {
      try {
        const body = await options.preDelete(doc, req);
        if (body === null) {
          logger.warn(`DELETE Pre Delete for ${req.params.id} returned null`);
          return res.status(403).send({message: `Pre Delete for: ${req.params.id} returned null`});
        }
      } catch (e) {
        logger.warn(`DELETE Pre Delete error for ${req.params.id} error: ${(e as any).message}`);
        return res.status(400).send({message: `Pre Delete error: ${(e as any).message}`});
      }
    }

    // Support .deleted from isDeleted plugin
    if (
      Object.keys(model.schema.paths).includes("deleted") &&
      model.schema.paths.deleted.instance === "Boolean"
    ) {
      doc.deleted = true;
      await doc.save();
    } else {
      // For models without the isDeleted plugin
      try {
        await doc.remove();
      } catch (e) {
        return res.status(400).send({message: (e as any).message});
      }
    }

    if (options.postDelete) {
      try {
        await options.postDelete(req);
      } catch (e) {
        return res.status(400).send({message: `Post Delete error: ${(e as any).message}`});
      }
    }

    return res.sendStatus(204);
  });

  async function arrayOperation(
    req: Request,
    res: Response,
    operation: "POST" | "PATCH" | "DELETE"
  ) {
    // TODO Combine array operations and .patch(), as they are very similar.
    const model = getModel(baseModel, req.body, options);

    if (!(await checkPermissions("update", options.permissions.update, req.user))) {
      throw new APIError({
        title: `Access to PATCH on ${model.name} denied for ${req.user?.id}`,
        status: 405,
      });
    }

    const doc = await model.findById(req.params.id);
    // We fail here because we might fetch the document without the __t but we'd be missing all the hooks.
    if (!doc || (doc.__t && !req.body.__t)) {
      throw new APIError({
        title: `Could not find document to PATCH: ${req.params.id}`,
        status: 404,
      });
    }

    if (!(await checkPermissions("update", options.permissions.update, req.user, doc))) {
      throw new APIError({
        title: `Patch not allowed for user ${req.user?.id} on doc ${doc._id}`,
        status: 403,
      });
    }

    // We apply the operation *before* the hooks. As far as the callers are concerned, this should
    // be like PATCHing the field and replacing the whole thing.
    if (operation !== "DELETE" && req.body[req.params.field] === undefined) {
      throw new APIError({
        title: `Malformed body, array operations should have a single, top level key, got: ${Object.keys(
          req.body
        ).join(",")}`,
        status: 400,
      });
    }

    const field = req.params.field;

    const array = [...doc[field]];
    if (operation === "POST") {
      array.push(req.body[field]);
    } else if (operation === "PATCH" || operation === "DELETE") {
      // Check for subschema vs String array:
      let index;
      if (isValidObjectId(req.params.itemId)) {
        index = array.findIndex((x: any) => x.id === req.params.itemId);
      } else {
        index = array.findIndex((x: string) => x === req.params.itemId);
      }
      if (index === -1) {
        throw new APIError({
          title: `Could not find ${field}/${req.params.itemId}`,
          status: 404,
        });
      }
      if (operation === "PATCH") {
        array[index] = req.body[field];
      } else {
        array.splice(index, 1);
      }
    } else {
      throw new APIError({
        title: `Invalid array operation: ${operation}`,
        status: 400,
      });
    }
    let body: Partial<T> | null = {[field]: array} as unknown as Partial<T>;

    try {
      body = transform(options, body, "update", req.user) as Partial<T>;
    } catch (e) {
      throw new APIError({
        title: (e as any).message,
        status: 403,
      });
    }

    if (options.preUpdate) {
      try {
        body = await options.preUpdate(body, req);
      } catch (e) {
        throw new APIError({
          title: `PATCH Pre Update error on ${req.params.id}: ${(e as any).message}`,
          status: 400,
        });
      }
      if (body === null) {
        throw new APIError({
          title: `PATCH Pre Update on ${req.params.id} returned null`,
          status: 403,
        });
      }
    }

    // Using .save here runs the risk of a versioning error if you try to make two simultaneous updates. We won't
    // wind up with corrupted data, just an API error.
    try {
      Object.assign(doc, body);
      await doc.save();
    } catch (e) {
      throw new APIError({
        title: `PATCH Pre Update error on ${req.params.id}: ${(e as any).message}`,
        status: 400,
      });
    }

    if (options.postUpdate) {
      try {
        await options.postUpdate(doc, body, req);
      } catch (e) {
        throw new APIError({
          title: `PATCH Post Update error on ${req.params.id}: ${(e as any).message}`,
          status: 400,
        });
      }
    }
    return res.json({data: serialize<T>(options, doc, req.user)});
  }

  async function arrayPost(req: Request, res: Response) {
    return arrayOperation(req, res, "POST");
  }

  async function arrayPatch(req: Request, res: Response) {
    return arrayOperation(req, res, "PATCH");
  }

  async function arrayDelete(req: Request, res: Response) {
    return arrayOperation(req, res, "DELETE");
  }
  // Set up routes for managing array fields. Check if there any array fields to add this for.
  if (Object.values(baseModel.schema.paths).find((config) => config.instance === "Array")) {
    router.post(`/:id/:field`, authenticateMiddleware(true), asyncHandler(arrayPost));
    router.patch(`/:id/:field/:itemId`, authenticateMiddleware(true), asyncHandler(arrayPatch));
    router.delete(`/:id/:field/:itemId`, authenticateMiddleware(true), asyncHandler(arrayDelete));
    router.use(apiErrorMiddleware);
  }

  return router;
}

function apiErrorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (isAPIError(err)) {
    return res.status(err.status).json(getAPIErrorBody(err));
  }
  return next(err);
}

// Since express doesn't handle async routes well, wrap them with this function.
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};
