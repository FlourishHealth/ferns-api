/**
 * This is the doc comment for api.ts
 *
 * @packageDocumentation
 */
import express, {NextFunction, Request, Response} from "express";
import cloneDeep from "lodash/cloneDeep";
import isFunction from "lodash/isFunction";
import mongoose, {Document, Model} from "mongoose";

import {authenticateMiddleware, User} from "./auth";
import {APIError, apiErrorMiddleware, isAPIError} from "./errors";
import {
  createOpenApiMiddleware,
  deleteOpenApiMiddleware,
  getOpenApiMiddleware,
  listOpenApiMiddleware,
  patchOpenApiMiddleware,
} from "./openApi";
import {checkPermissions, RESTPermissions} from "./permissions";
import {defaultResponseHandler, FernsTransformer, serialize, transform} from "./transformers";
import {isValidObjectId} from "./utils";

export type JSONPrimitive = string | number | boolean | null;
export interface JSONArray extends Array<JSONValue> {}
export type JSONObject = {[member: string]: JSONValue};
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

// TODOS:
// Support bulk actions
// Support more complex query fields
// Rate limiting

// These are the query params that are reserved for pagination.
const PAGINATION_QUERY_PARAMS = ["limit", "page"];

// Add support for more complex queries.
const COMPLEX_QUERY_PARAMS = ["$and", "$or"];

/**
 * @param a - the first number
 * @param b - the second number
 * @returns The sum of `a` and `b`
 */
export type RESTMethod = "list" | "create" | "read" | "update" | "delete";

export type PopulatePaths = string[] | ((req: Request) => string[]);
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
  /**
   * Allow anonymous users to access the resource.
   * Defaults to false.
   */
  allowAnonymous?: boolean;
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
  queryFilter?: (
    user?: User,
    query?: Record<string, any>
  ) => Record<string, any> | null | Promise<Record<string, any> | null>;
  /** Transformers allow data to be transformed before actions are executed, and serialized before being returned to
   * the user.
   *
   * Transformers can be used to throw out fields that the user should not be able to write to, such as the `admin` flag.
   * Serializers can be used to hide data from the client or change how it is presented. Serializers run after the data
   * has been changed or queried but before returning to the client.
   * @deprecated Use preCreate/preUpdate/preDelete hooks instead of transformer.transform. Use serialize instead of
   * transformer.serialize.
   * */
  transformer?: FernsTransformer<T>;
  /** Default sort for list operations. Can be a single field, a space-seperated list of fields, or an object.
   * ?sort=foo // single field: foo ascending
   * ?sort=-foo // single field: foo descending
   * ?sort=-foo bar // multi field: foo descending, bar ascending
   * ?sort=\{foo: 'ascending', bar: 'descending'\} // object: foo ascending, bar descending
   *
   * Note: you should have an index field on these fields or Mongo may slow down considerably.
   * */
  sort?: string | {[key: string]: "ascending" | "descending"};
  /** Default queries to provide to Mongo before any user queries or transforms happen when making list queries.
   * Accepts any Mongoose-style queries, and runs for all user types.
   *    defaultQueryParams: \{hidden: false\} // By default, don't show objects with hidden=true
   * These can be overridden by the user if not disallowed by queryFilter. */
  defaultQueryParams?: {[key: string]: any};
  /** Paths to populate before returning data from list queries. Accepts Mongoose-style populate strings.
   *  May also be a function that takes the request and returns a list of paths to populate. This is handy if you need
   *  to populate based on the user or request, such as app version.
   *    ["ownerId"] // populates the User that matches `ownerId`
   *    ["ownerId.organizationId"] // Nested. Populates the User that matches `ownerId`, as well as their organization.
   *
   *  Note: The array of strings style will be correctly handled by OpenAPI, but the function style will not currently.
   * */
  populatePaths?: PopulatePaths;
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
  /** Hook that runs after the object is created but before the responseHandler serializes and returned. This is a good
   * spot to perform dependent changes to other models or performing async tasks/side effects, such as sending a push
   * notification.
   * Throw an APIError to return a 400 with an error message. */
  postCreate?: (value: T, request: express.Request) => void | Promise<void>;
  /** Hook that runs after the object is updated but before the responseHandler serializes and returned. This is a good
   * spot to perform dependent changes to other models or performing async tasks/side effects, such as sending a push
   * notification.
   * Throw an APIError to return a 400 with an error message. */
  postUpdate?: (
    value: T,
    cleanedBody: any,
    request: express.Request,
    prevValue: T
  ) => void | Promise<void>;
  /** Hook that runs after the object is deleted. This is a good spot to
   * perform dependent changes to other models or performing async tasks/side effects, such as cascading object
   * deletions.
   * Throw an APIError to return a 400 with an error message. */
  postDelete?: (request: express.Request, value: T) => void | Promise<void>;
  /** Hook that runs after the object is fetched but before it is serialized.
   * Returns a promise so that asynchronous actions can be included in the function.
   * Throw an APIError to return a 400 with an error message.
   * @deprecated: Use responseHandler instead.
   */
  postGet?: (value: T, request: express.Request) => void | Promise<T>;
  /** Hook that runs after the list of objects is fetched but before they are serialized.
   * Returns a promise so that asynchronous actions can be included in the function.
   * Throw an APIError to return a 400 with an error message.
   * @deprecated: Use responseHandler instead.
   */
  postList?: (
    value: (Document<any, any, any> & T)[],
    request: express.Request
  ) => Promise<(Document<any, any, any> & T)[]>;
  /** Serialize an object or list of objects before returning to the client. This is a good spot to remove sensitive
   * information from the object, such as passwords or API keys.
   * Throw an APIError to return a 400 with an error message.
   */
  responseHandler?: (
    value: (Document<any, any, any> & T) | (Document<any, any, any> & T)[],
    method: "list" | "create" | "read" | "update" | "delete",
    request: express.Request,
    options: FernsRouterOptions<T>
  ) => Promise<JSONValue | null>;
  /** The discriminatorKey that you passed when creating the Mongoose models. Defaults to __t. See:
   * https://mongoosejs.com/docs/discriminators.html
   * If this key is provided, you must provide the same key as part of the top level of the body when making performing
   * update or delete operations on this model.
   *    \{discriminatorKey: "__t"\}
   *
   *     PATCH \{__t: "SuperUser", name: "Foo"\} // __t is required or there will be a 404 error.
   */
  discriminatorKey?: string;
  /**
   * The OpenAPI generator for this server. This is used to generate the OpenAPI documentation.
   */
  openApi?: any;
  /**
   * Overwrite parts of the configuration for the OpenAPI generator. This will be merged with the generated
   * configuration.
   */
  openApiOverwrite?: {
    get?: any;
    list?: any;
    create?: any;
    update?: any;
    delete?: any;
  };
  /**
   * Overwrite parts of the model properties for the OpenAPI generator. This will be merged with the generated
   * configuration. This is useful if you add custom properties to the model during serialize, for example, that you
   * want to be documented and typed in the SDK.
   */
  openApiExtraModelProperties?: any;
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

function populate(
  req: express.Request,
  builtQuery: mongoose.Query<any[], any, {}, any>,
  populatePaths?: PopulatePaths
) {
  // TODO: we should handle nested serializers here.
  let paths: string[];

  if (isFunction(populatePaths)) {
    try {
      paths = populatePaths(req);
    } catch (e: any) {
      throw new APIError({status: 500, title: `Error in populatePaths function: ${e}`, error: e});
    }
  } else {
    paths = populatePaths ?? [];
  }

  for (const populatePath of paths) {
    builtQuery = builtQuery.populate(populatePath);
  }
  return builtQuery;
}

// Ensures query params are allowed. Also checks nested query params when using $and/$or.
function checkQueryParamAllowed(
  queryParam: string,
  queryParamValue: any,
  queryFields: string[] = []
) {
  // Check the values of each of the complex query params. We don't support recursive queries here, just one level of
  // and/or
  if (COMPLEX_QUERY_PARAMS.includes(queryParam)) {
    // Complex query of the form `$and: [{key1: value1}, {key2: value2}]`
    for (const subQuery of queryParamValue) {
      for (const subKey of Object.keys(subQuery)) {
        checkQueryParamAllowed(subKey, subQuery[subKey], queryFields);
      }
    }
    return;
  }
  if (!queryFields.includes(queryParam)) {
    throw new APIError({
      status: 400,
      title: `${queryParam} is not allowed as a query param.`,
    });
  }
}

/**
 * Create a set of CRUD routes given a Mongoose model $baseModel and configuration options.
 *
 * @param baseModel A Mongoose Model
 * @param options Options for configuring the REST API, such as permissions, transformers, and hooks.
 */
export function fernsRouter<T>(
  baseModel: Model<T>,
  options: FernsRouterOptions<T>
): express.Router {
  const router = express.Router();

  // Do before the other router options so endpoints take priority.
  if (options.endpoints) {
    options.endpoints(router);
  }

  const responseHandler = options.responseHandler ?? defaultResponseHandler;

  router.post(
    "/",
    [authenticateMiddleware(options.allowAnonymous), createOpenApiMiddleware(baseModel, options)],
    asyncHandler(async (req: Request, res: Response) => {
      const model = getModel(baseModel, req.body?.__t, options);
      if (!(await checkPermissions("create", options.permissions.create, req.user))) {
        throw new APIError({
          status: 405,
          title: `Access to POST on ${model.name} denied for ${req.user?.id}`,
        });
      }

      let body: Partial<T> | (Partial<T> | undefined)[] | null | undefined;
      try {
        body = transform<T>(options, req.body, "create", req.user);
      } catch (e: any) {
        throw new APIError({
          status: 400,
          title: e.message,
          error: e,
        });
      }
      if (options.preCreate) {
        try {
          body = await options.preCreate(body, req);
        } catch (e: any) {
          if (isAPIError(e)) {
            throw e;
          } else {
            throw new APIError({
              title: `preCreate hook error: ${e.message}`,
              error: e,
            });
          }
        }
        if (body === undefined) {
          throw new APIError({
            status: 403,
            title: "Create not allowed",
            detail: "A body must be returned from preCreate",
          });
        } else if (body === null) {
          throw new APIError({
            status: 403,
            title: "Create not allowed",
            detail: "preCreate hook returned null",
          });
        }
      }
      let data;
      try {
        data = await model.create(body);
      } catch (e: any) {
        throw new APIError({
          status: 400,
          title: e.message,
          error: e,
        });
      }

      if (options.populatePaths) {
        try {
          let populateQuery = model.findById(data._id);
          populateQuery = populate(req, populateQuery, options.populatePaths);
          data = await populateQuery.exec();
        } catch (e: any) {
          throw new APIError({
            status: 400,
            title: `Populate error: ${e.message}`,
            error: e,
          });
        }
      }

      if (options.postCreate) {
        try {
          await options.postCreate(data, req);
        } catch (e: any) {
          throw new APIError({
            status: 400,
            title: `postCreate hook error: ${e.message}`,
            error: e,
          });
        }
      }
      const serialized = await responseHandler(data, "create", req, options);
      return res.status(201).json({data: serialized});
    })
  );

  // TODO add rate limit
  router.get(
    "/",
    [authenticateMiddleware(options.allowAnonymous), listOpenApiMiddleware(baseModel, options)],
    asyncHandler(async (req: Request, res: Response) => {
      // For pure read queries, Mongoose will return the correct data with just the base model.
      const model = baseModel;

      if (!(await checkPermissions("list", options.permissions.list, req.user))) {
        throw new APIError({
          status: 403,
          title: `Access to LIST on ${model.name} denied for ${req.user?.id}`,
        });
      }

      let query: any = {};
      for (const queryParam of Object.keys(options.defaultQueryParams ?? [])) {
        query[queryParam] = (options.defaultQueryParams ?? {})[queryParam];
      }

      for (const queryParam of Object.keys(req.query)) {
        if (PAGINATION_QUERY_PARAMS.includes(queryParam)) {
          continue;
        }
        checkQueryParamAllowed(queryParam, req.query[queryParam], options.queryFields);

        // Not sure if this is necessary or if mongoose does the right thing.
        if (req.query[queryParam] === "true") {
          query[queryParam] = true;
        } else if (req.query[queryParam] === "false") {
          query[queryParam] = false;
        } else {
          query[queryParam] = req.query[queryParam];
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
        } catch (e: any) {
          throw new APIError({
            status: 400,
            title: `Query filter error: ${e}`,
            error: e,
          });
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
          throw new APIError({
            status: 400,
            title: `Invalid page: ${req.query.page}`,
          });
        }
        builtQuery = builtQuery.skip((Number(req.query.page) - 1) * limit);
      }

      if (options.sort) {
        builtQuery = builtQuery.sort(options.sort);
      }

      const populatedQuery = populate(req, builtQuery, options.populatePaths);

      let data: (Document<any, any, any> & T)[];
      try {
        data = await populatedQuery.exec();
      } catch (e: any) {
        throw new APIError({
          title: `List error: ${e.stack}`,
          error: e,
        });
      }

      if (options.postList) {
        try {
          data = await options.postList(data, req);
        } catch (e: any) {
          throw new APIError({
            status: 400,
            title: `postList hook error on ${req.params.id}: ${e.message}`,
            error: e,
          });
        }
      }

      // Uses metadata rather than counting the number of documents in the array for performance.
      const total = await model.estimatedDocumentCount();

      let serialized = await responseHandler(data, "list", req, options);

      let more;
      try {
        if (serialized && Array.isArray(serialized)) {
          more = serialized.length === limit + 1 && serialized.length > 0;
          if (more) {
            // Slice off the extra document we fetched to determine if more is true or not.
            serialized = serialized.slice(0, limit);
          }
          return res.json({data: serialized, more, page: req.query.page, limit, total});
        } else {
          return res.json({data: serialized});
        }
      } catch (e: any) {
        throw new APIError({
          title: `Serialization error: ${e.message}`,
          error: e,
        });
      }
    })
  );

  router.get(
    "/:id",
    [authenticateMiddleware(options.allowAnonymous), getOpenApiMiddleware(baseModel, options)],
    asyncHandler(async (req: Request, res: Response) => {
      // For pure read queries, Mongoose will return the correct data with just the base model.
      const model = baseModel;

      if (!(await checkPermissions("read", options.permissions.read, req.user))) {
        throw new APIError({
          status: 405,
          title: `Access to GET on ${model.name} denied for ${req.user?.id}`,
        });
      }

      const builtQuery = model.findById(req.params.id);
      const populatedQuery = populate(req, builtQuery as any, options.populatePaths);

      let data;
      try {
        data = await populatedQuery.exec();
      } catch (e: any) {
        throw new APIError({
          title: `GET failed on ${req.params.id}`,
          error: e,
        });
      }

      if (!data) {
        throw new APIError({
          status: 404,
          title: `Document ${req.params.id} not found`,
        });
      }

      if (!(await checkPermissions("read", options.permissions.read, req.user, data))) {
        throw new APIError({
          status: 403,
          title: `Access to GET on ${model.name}:${req.params.id} denied for ${req.user?.id}`,
        });
      }

      if (options.postGet) {
        try {
          data = await options.postGet(data, req);
        } catch (e: any) {
          throw new APIError({
            status: 400,
            title: `postGet hook error on ${req.params.id}: ${e.message}`,
            error: e,
          });
        }
      }

      const serialized = await responseHandler(data, "read", req, options);
      return res.json({data: serialized});
    })
  );

  router.put(
    "/:id",
    authenticateMiddleware(options.allowAnonymous),
    asyncHandler(async (_req: Request, _res: Response) => {
      // Patch is what we want 90% of the time
      throw new APIError({
        title: `PUT is not supported.`,
      });
    })
  );

  router.patch(
    "/:id",
    [authenticateMiddleware(options.allowAnonymous), patchOpenApiMiddleware(baseModel, options)],
    asyncHandler(async (req: Request, res: Response) => {
      const model = getModel(baseModel, req.body, options);

      if (!(await checkPermissions("update", options.permissions.update, req.user))) {
        throw new APIError({
          status: 405,
          title: `Access to PATCH on ${model.name} denied for ${req.user?.id}`,
        });
      }

      let doc = await model.findById(req.params.id);
      // We fail here because we might fetch the document without the __t but we'd be missing all the hooks.
      if (!doc || (doc.__t && !req.body.__t)) {
        throw new APIError({
          status: 404,
          title: `Could not find document to PATCH: ${req.params.id}`,
        });
      }

      if (!(await checkPermissions("update", options.permissions.update, req.user, doc))) {
        throw new APIError({
          status: 403,
          title: `PATCH not allowed for user ${req.user?.id} on doc ${doc._id}`,
        });
      }

      let body;
      try {
        body = transform<T>(options, req.body, "update", req.user);
      } catch (e: any) {
        throw new APIError({
          status: 403,
          title: `PATCH failed on ${req.params.id} for user ${req.user?.id}: ${e.message}`,
          error: e,
        });
      }

      if (options.preUpdate) {
        try {
          body = await options.preUpdate(body, req);
        } catch (e: any) {
          if (isAPIError(e)) {
            throw e;
          } else {
            throw new APIError({
              title: `preUpdate hook error on ${req.params.id}: ${e.message}`,
              error: e,
            });
          }
        }
        if (body === undefined) {
          throw new APIError({
            status: 403,
            title: "Update not allowed",
            detail: "A body must be returned from preUpdate",
          });
        } else if (body === null) {
          throw new APIError({
            status: 403,
            title: "Update not allowed",
            detail: `preUpdate hook on ${req.params.id} returned null`,
          });
        }
      }

      // Make a copy for passing pre-saved values to hooks.
      const prevDoc = cloneDeep(doc);

      // Using .save here runs the risk of a versioning error if you try to make two simultaneous updates. We won't
      // wind up with corrupted data, just an API error.
      try {
        Object.assign(doc, body);
        await doc.save();
      } catch (e: any) {
        throw new APIError({
          status: 400,
          title: `preUpdate hook error on ${req.params.id}: ${e.message}`,
          error: e,
        });
      }

      if (options.populatePaths) {
        let populateQuery = model.findById(doc._id);
        populateQuery = populate(req, populateQuery, options.populatePaths);
        doc = await populateQuery.exec();
      }

      if (options.postUpdate) {
        try {
          await options.postUpdate(doc, body, req, prevDoc);
        } catch (e: any) {
          throw new APIError({
            status: 400,
            title: `postUpdate hook error on ${req.params.id}: ${e.message}`,
            error: e,
          });
        }
      }
      const serialized = await responseHandler(doc, "update", req, options);
      return res.json({data: serialized});
    })
  );

  router.delete(
    "/:id",
    [authenticateMiddleware(options.allowAnonymous), deleteOpenApiMiddleware(baseModel, options)],
    asyncHandler(async (req: Request, res: Response) => {
      const model = getModel(baseModel, req.body, options);
      if (!(await checkPermissions("delete", options.permissions.delete, req.user))) {
        throw new APIError({
          status: 405,
          title: `Access to DELETE on ${model.name} denied for ${req.user?.id}`,
        });
      }

      const doc = await model.findById(req.params.id);

      // We fail here because we might fetch the document without the __t but we'd be missing all the hooks.
      if (!doc || (doc.__t && !req.body.__t)) {
        throw new APIError({
          status: 404,
          title: `Could not find document to DELETE: ${req.user?.id}`,
        });
      }

      if (!(await checkPermissions("delete", options.permissions.delete, req.user, doc))) {
        throw new APIError({
          status: 403,
          title: `Access to DELETE on ${model.name}:${req.params.id} denied for ${req.user?.id}`,
        });
      }

      if (options.preDelete) {
        let body;
        try {
          body = await options.preDelete(doc, req);
        } catch (e: any) {
          if (isAPIError(e)) {
            throw e;
          } else {
            throw new APIError({
              status: 403,
              title: `preDelete hook error on ${req.params.id}: ${e.message}`,
              error: e,
            });
          }
        }
        if (body === undefined) {
          throw new APIError({
            status: 403,
            title: "Delete not allowed",
            detail: "A body must be returned from preDelete",
          });
        } else if (body === null) {
          throw new APIError({
            status: 403,
            title: "Delete not allowed",
            detail: `preDelete hook for ${req.params.id} returned null`,
          });
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
          await doc.deleteOne();
        } catch (e: any) {
          throw new APIError({
            status: 400,
            title: e.message,
            error: e,
          });
        }
      }

      if (options.postDelete) {
        try {
          await options.postDelete(req, doc);
        } catch (e: any) {
          throw new APIError({
            status: 400,
            title: `postDelete hook error: ${e.message}`,
            error: e,
          });
        }
      }

      return res.status(204).json({});
    })
  );

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
    } catch (e: any) {
      throw new APIError({
        title: e.message,
        status: 403,
        error: e,
      });
    }

    if (options.preUpdate) {
      try {
        body = await options.preUpdate(body, req);
      } catch (e: any) {
        throw new APIError({
          title: `preUpdate hook error on ${req.params.id}: ${e.message}`,
          status: 400,
          error: e,
        });
      }
      if (body === undefined) {
        throw new APIError({
          status: 403,
          title: "Update not allowed",
          detail: "A body must be returned from preUpdate",
        });
      } else if (body === null) {
        throw new APIError({
          title: "Update not allowed",
          detail: `preUpdate hook on ${req.params.id} returned null`,
          status: 403,
        });
      }
    }

    // Make a copy for passing pre-saved values to hooks.
    const prevDoc = cloneDeep(doc);

    // Using .save here runs the risk of a versioning error if you try to make two simultaneous updates. We won't
    // wind up with corrupted data, just an API error.
    try {
      Object.assign(doc, body);
      await doc.save();
    } catch (e: any) {
      throw new APIError({
        title: `PATCH Pre Update error on ${req.params.id}: ${e.message}`,
        status: 400,
        error: e,
      });
    }

    if (options.postUpdate) {
      try {
        await options.postUpdate(doc, body, req, prevDoc);
      } catch (e: any) {
        throw new APIError({
          title: `PATCH Post Update error on ${req.params.id}: ${e.message}`,
          status: 400,
          error: e,
        });
      }
    }
    return res.json({data: serialize<T>(req, options, doc)});
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
    router.post(
      `/:id/:field`,
      authenticateMiddleware(options.allowAnonymous),
      asyncHandler(arrayPost)
    );
    router.patch(
      `/:id/:field/:itemId`,
      authenticateMiddleware(options.allowAnonymous),
      asyncHandler(arrayPatch)
    );
    router.delete(
      `/:id/:field/:itemId`,
      authenticateMiddleware(options.allowAnonymous),
      asyncHandler(arrayDelete)
    );
  }
  router.use(apiErrorMiddleware);

  return router;
}

// Since express doesn't handle async routes well, wrap them with this function.
export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// For backwards compatibility with the old names.
export const gooseRestRouter = fernsRouter;
export type GooseRESTOptions<T> = FernsRouterOptions<T>;
