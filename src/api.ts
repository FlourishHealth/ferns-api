/**
 * This is the doc comment for api.ts
 *
 * @packageDocumentation
 */
import express, {NextFunction, Request, Response} from "express";
import mongoose, {Document, Model} from "mongoose";

import {authenticateMiddleware, User} from "./auth";
import {APIError, apiErrorMiddleware} from "./errors";
import {logger} from "./logger";
import {checkPermissions, RESTPermissions} from "./permissions";
import {FernsTransformer, serialize, transform} from "./transformers";
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

/**
 * This is the main configuration.
 * @param T - the base document type. This should not include Mongoose models, just the types of the object.
 */
export interface FernsRouterOptions<T> {
  /**
   * A group of method-level (create/read/update/delete/list) permissions. Determine if the user can perform the
   * operation at all, and for read/update/delete methods, whether the user can perform the operation on the object
   * referenced.
   * */
  permissions: RESTPermissions<T>;
  /** A list of fields on the model that can be queried using standard comparisons for booleans, strings, dates
   *    (as ISOStrings), and numbers.
   * For example:
   *  ?foo=true // boolean query
   *  ?foo=bar // string query
   *  ?foo=1 // number query
   *  ?foo=2022-07-23T02:34:07.118Z // date query (should first be encoded for query params, not shown here)
   * Note: `limit` and `page` are automatically supported and are reserved. */
  queryFields?: string[];
  /** queryFilter is a function to parse the query params and see if the query should be allowed. This can be used for
   * permissioning to make sure less privileged users are not making privileged queries. If a query should not be
   * allowed, return `null` from the function and an empty query result will be returned to the client without an error.
   * You can also throw an APIError to be explicit about the issues. You can transform the given query params by
   * returning different values. If the query is acceptable as-is, return `query` as-is. */
  queryFilter?: (user?: User, query?: Record<string, any>) => Record<string, any> | null;
  /** Transformers allow data to be transformed before actions are executed, and serialized before being returned to
   * the user.
   *
   * Transformers can be used to throw out fields that the user should not be able to write to, such as the `admin` flag.
   * Serializers can be used to hide data from the client or change how it is presented. Serializers run after the data
   * has been changed or queried but before returning to the client.
   * */
  transformer?: FernsTransformer<T>;
  /** Default sort for list operations. Can be a single field, a space-seperated list of fields, or an object.
   * ?sort=foo // single field: foo ascending
   * ?sort=-foo // single field: foo descending
   * ?sort=-foo bar // multi field: foo descending, bar ascending
   * ?sort=\{foo: 'ascending', bar: 'descending'\} // object: foo ascending, bar descending
   *
   * Note: you should have an index field on these fields or Mongo may slow down considerably.
   * @deprecated Use preCreate/preUpdate/preDelete hooks instead of transformer.transform.
   * */
  sort?: string | {[key: string]: "ascending" | "descending"};
  /** Default queries to provide to Mongo before any user queries or transforms happen when making list queries.
   * Accepts any Mongoose-style queries, and runs for all user types.
   *    defaultQueryParams: \{hidden: false\} // By default, don't show objects with hidden=true
   * These can be overridden by the user if not disallowed by queryFilter. */
  defaultQueryParams?: {[key: string]: any};
  /** Paths to populate before returning data from list queries. Accepts Mongoose-style populate strings.
   *    ["ownerId"] // populates the User that matches `ownerId`
   *    ["ownerId.organizationId"] // Nested. Populates the User that matches `ownerId`, as well as their organization.
   * */
  populatePaths?: string[];
  /** Default limit applied to list queries if not specified by the user. Defaults to 100. */
  defaultLimit?: number;
  /** Maximum query limit the user can request. Defaults to 500, and is the lowest of the limit query, max limit,
   *  or 500. */
  maxLimit?: number; // defaults to 500
  /** */
  endpoints?: (router: any) => void;
  /** Hook that runs after `transformer.transform` but before the object is created. Can update the body fields based on
   * the request or the user.
   * Return null to return a generic 403
   * error. Throw an APIError to return a 400 with specific error information. */
  preCreate?: (value: any, request: express.Request) => T | Promise<T> | null;
  /** Hook that runs after `transformer.transform` but before changes are made for update operations. Can update the
   * body fields based on the request or the user. Also applies to all array operations.
   * Return null to return a generic 403
   * error. Throw an APIError to return a 400 with specific error information. */
  preUpdate?: (value: any, request: express.Request) => T | Promise<T> | null;
  /** Hook that runs after `transformer.transform` but before the object is delete.
   * Return null to return a generic 403
   * error. Throw an APIError to return a 400 with specific error information. */
  preDelete?: (value: any, request: express.Request) => T | Promise<T> | null;
  /** Hook that runs after the object is created but before it is serialized and returned. This is a good spot to
   * perform dependent changes to other models or performing async tasks, such as sending a push notification.
   * Throw an APIError to return a 400 with an error message. */
  postCreate?: (value: T, request: express.Request) => void | Promise<void>;
  /** Hook that runs after the object is updated but before it is serialized and returned. This is a good spot to
   * perform dependent changes to other models or performing async tasks, such as sending a push notification.
   * Throw an APIError to return a 400 with an error message. */
  postUpdate?: (value: T, cleanedBody: any, request: express.Request) => void | Promise<void>;
  /** Hook that runs after the object is created but before it is serialized and returned. This is a good spot to
   * perform dependent changes to other models or performing async tasks, such as cascading object deletions.
   * Throw an APIError to return a 400 with an error message. */
  postDelete?: (request: express.Request) => void | Promise<void>;
  /** The discriminatorKey that you passed when creating the Mongoose models. Defaults to __t. See:
   * https://mongoosejs.com/docs/discriminators.html
   * If this key is provided, you must provide the same key as part of the top level of the body when making performing
   * update or delete operations on this model.
   *    \{discriminatorKey: "__t"\}
   *
   *     PATCH \{__t: "SuperUser", name: "Foo"\} // __t is required or there will be a 404 error.
   */
  discriminatorKey?: string;
}

// A function to decide which model to use. If no discriminators are provided, just returns the base model. If
function getModel(baseModel: Model<any>, body?: any, options?: FernsRouterOptions<any>) {
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
export function fernsRouter<T>(
  baseModel: Model<any>,
  options: FernsRouterOptions<T>
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

    // Check if any of the keys in the query are not allowed by options.queryFilter
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
      body = transform<T>(options, req.body, "update", req.user);
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
      body = transform<T>(options, body, "update", req.user) as Partial<T>;
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

// Since express doesn't handle async routes well, wrap them with this function.
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// For backwards compatibility with the old names.
export const gooseRestRouter = fernsRouter;
export type GooseRESTOptions<T> = FernsRouterOptions<T>;
