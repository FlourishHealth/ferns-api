import express from "express";
import session from "express-session";
import jwt from "jsonwebtoken";
import mongoose, {Document, Model, ObjectId, Schema} from "mongoose";
import passport from "passport";
import {Strategy as AnonymousStrategy} from "passport-anonymous";
import {Strategy as JwtStrategy} from "passport-jwt";
import {Strategy as LocalStrategy} from "passport-local";

import {logger} from "./logger";

export interface Env {
  NODE_ENV?: string;
  PORT?: string;
  SENTRY_DSN?: string;
  SLACK_WEBHOOK?: string;
  // JWT
  TOKEN_SECRET?: string;
  TOKEN_EXPIRES_IN?: string;
  TOKEN_ISSUER?: string;
  // AUTH
  SESSION_SECRET?: string;
}

// TODOS:
// Support bulk actions
// Support more complex query fields
// Rate limiting

const SPECIAL_QUERY_PARAMS = ["limit", "page"];

export type RESTMethod = "list" | "create" | "read" | "update" | "delete";

interface GooseTransformer<T> {
  // Runs before create or update operations. Allows throwing out fields that the user should be
  // able to write to, modify data, check permissions, etc.
  transform?: (obj: Partial<T>, method: "create" | "update", user?: User) => Partial<T> | undefined;
  // Runs after create/update operations but before data is returned from the API. Serialize fetched
  // data, dropping fields based on user, changing data, etc.
  serialize?: (obj: T, user?: User) => Partial<T> | undefined;
}

type UserType = "anon" | "auth" | "owner" | "admin";

interface User {
  _id: ObjectId | string;
  id: string;
  admin: boolean;
  isAnonymous?: boolean;
  token?: string;
}

export interface UserModel extends Model<User> {
  createAnonymousUser?: (id?: string) => Promise<User>;
  postCreate?: (body: any) => Promise<void>;

  createStrategy(): any;

  serializeUser(): any;

  // Allows additional setup during signup. This will be passed the rest of req.body from the signup
  deserializeUser(): any;
}

export type PermissionMethod<T> = (
  method: RESTMethod,
  user?: User,
  obj?: T
) => boolean | Promise<boolean>;

interface RESTPermissions<T> {
  create: PermissionMethod<T>[];
  list: PermissionMethod<T>[];
  read: PermissionMethod<T>[];
  update: PermissionMethod<T>[];
  delete: PermissionMethod<T>[];
}

interface GooseRESTOptions<T> {
  permissions: RESTPermissions<T>;
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
    return user?.id && obj?.ownerId && String(obj?.ownerId) === String(user?.id);
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

// Defaults closed
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

export function tokenPlugin(schema: Schema) {
  schema.add({token: {type: String, index: true}});
  schema.pre("save", function (next) {
    // Add created when creating the object
    if (!this.token) {
      const tokenOptions: any = {
        expiresIn: "10h",
      };
      if ((process.env as Env).TOKEN_EXPIRES_IN) {
        tokenOptions.expiresIn = (process.env as Env).TOKEN_EXPIRES_IN;
      }
      if ((process.env as Env).TOKEN_ISSUER) {
        tokenOptions.issuer = (process.env as Env).TOKEN_ISSUER;
      }

      const secretOrKey = (process.env as Env).TOKEN_SECRET;
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

export interface IsDeleted {
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

export function authenticateMiddleware(anonymous = false) {
  const strategies = ["jwt"];
  if (anonymous) {
    strategies.push("anonymous");
  }
  return passport.authenticate(strategies, {session: false, failureMessage: true});
}

export async function signupUser(
  userModel: UserModel,
  email: string,
  password: string,
  body?: any
) {
  try {
    const user = await (userModel as any).register({email}, password);
    if (user.postCreate) {
      delete body.email;
      delete body.password;
      try {
        await user.postCreate(body);
      } catch (e) {
        logger.error("Error in user.postCreate", e);
        throw e;
      }
    }
    await user.save();
    if (!user.token) {
      throw new Error("Token not created");
    }
    return user;
  } catch (error) {
    throw error;
  }
}

// TODO allow customization
export function setupAuth(app: express.Application, userModel: UserModel) {
  passport.use(new AnonymousStrategy());
  passport.use(
    "signup",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        try {
          done(undefined, await signupUser(userModel, email, password, req.body));
        } catch (e) {
          return done(e);
        }
      }
    )
  );

  passport.use(
    "login",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await userModel.findOne({email});

          if (!user) {
            logger.warn(`Could not find login user for ${email}`);
            return done(null, false, {message: "User Not Found"});
          }

          const validate = await (user as any).authenticate(password);
          if (validate.error) {
            logger.warn("Invalid password for", email);
            return done(null, false, {message: "Incorrect Password"});
          }

          return done(null, user, {message: "Logged in Successfully"});
        } catch (error) {
          logger.error("Login error", error);
          return done(error);
        }
      }
    )
  );

  if (!userModel.createStrategy) {
    throw new Error("setupAuth userModel must have .createStrategy()");
  }
  if (!userModel.serializeUser) {
    throw new Error("setupAuth userModel must have .serializeUser()");
  }
  if (!userModel.deserializeUser) {
    throw new Error("setupAuth userModel must have .deserializeUser()");
  }

  // use static serialize and deserialize of model for passport session support
  passport.serializeUser(userModel.serializeUser());
  passport.deserializeUser(userModel.deserializeUser());

  if ((process.env as Env).TOKEN_SECRET) {
    logger.debug("Setting up JWT Authentication");

    const customExtractor = function (req: express.Request) {
      let token = null;
      if (req?.cookies?.jwt) {
        token = req.cookies.jwt;
      } else if (req?.headers?.authorization) {
        token = req?.headers?.authorization.split(" ")[1];
      }
      return token;
    };
    const secretOrKey = (process.env as Env).TOKEN_SECRET;
    if (!secretOrKey) {
      throw new Error(`TOKEN_SECRET must be set in env.`);
    }
    const jwtOpts = {
      // jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("Bearer"),
      jwtFromRequest: customExtractor,
      secretOrKey,
      issuer: (process.env as Env).TOKEN_ISSUER,
    };
    passport.use(
      "jwt",
      new JwtStrategy(jwtOpts, async function (
        payload: {id: string; iat: number; exp: number},
        done: any
      ) {
        let user;
        if (!payload) {
          return done(null, false);
        }
        try {
          user = await userModel.findById((payload as any).id);
        } catch (e) {
          logger.warn("[jwt] Error finding user from id", e);
          return done(e, false);
        }
        if (user) {
          return done(null, user);
        } else {
          if (userModel.createAnonymousUser) {
            logger.info("[jwt] Creating anonymous user");
            user = await userModel.createAnonymousUser();
            return done(null, user);
          } else {
            logger.info("[jwt] No user found from token");
            return done(null, false);
          }
        }
      })
    );
  }

  const router = express.Router();
  router.post("/login", function (req, res, next) {
    passport.authenticate("login", (err: any, user: any, info: any) => {
      if (err) {
        logger.error("Error logging in:", err);
        return next(err);
      }
      if (!user) {
        logger.warn("Invalid login:", info);
        return res.status(401).json({message: info?.message});
      }
      req.logIn(user, function (loginError: any) {
        if (loginError) {
          return next(loginError);
        }
        return res.json({data: {userId: req?.user?._id, token: (req?.user as any)?.token}});
      });
    })(req, res, next);
  });

  router.post(
    "/signup",
    passport.authenticate("signup", {session: false, failWithError: true}),
    async function (req: any, res: any) {
      return res.json({data: {userId: req.user._id, token: req.user.token}});
    }
  );

  router.get("/me", authenticateMiddleware(), async (req, res) => {
    if (!req.user?.id) {
      logger.debug("Not user found for /me");
      return res.sendStatus(401);
    }
    const data = await userModel.findById(req.user.id);

    if (!data) {
      logger.debug("Not user data found for /me");
      return res.sendStatus(404);
    }
    const dataObject = data.toObject();
    (dataObject as any).id = data._id;
    return res.json({data: dataObject});
  });

  router.patch("/me", authenticateMiddleware(), async (req, res) => {
    if (!req.user?.id) {
      return res.sendStatus(401);
    }
    const doc = await userModel.findById(req.user.id);
    if (!doc) {
      return res.sendStatus(404);
    }
    // TODO support limited updates for profile.
    // try {
    //   body = transform(req.body, "update", req.user);
    // } catch (e) {
    //   return res.status(403).send({message: (e as any).message});
    // }
    try {
      Object.assign(doc, req.body);
      await doc.save();

      const dataObject = doc.toObject();
      (dataObject as any).id = doc._id;
      return res.json({data: dataObject});
    } catch (e) {
      return res.status(403).send({message: (e as any).message});
    }
  });

  app.use(
    session({
      secret: (process.env as Env).SESSION_SECRET as string,
      resave: true,
      saveUninitialized: true,
    }) as any
  );
  app.use(express.urlencoded({extended: false}) as any);
  app.use(passport.initialize() as any);
  app.use(passport.session());

  app.set("etag", false);
  app.use("/auth", router);
}

function getUserType(user?: User, obj?: any): UserType {
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

export function gooseRestRouter<T>(
  baseModel: Model<any>,
  options: GooseRESTOptions<T>
): express.Router {
  const router = express.Router();

  function transform(data: Partial<T> | Partial<T>[], method: "create" | "update", user?: User) {
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

  function serialize(data: Document<T, {}, {}> | Document<T, {}, {}>[], user?: User) {
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
      body = transform(req.body, "create", req.user);
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
    return res.status(201).json({data: serialize(data, req.user)});
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
      let serialized = serialize(data, req.user);
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

    return res.json({data: serialize(data, req.user)});
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
      body = transform(req.body, "update", req.user);
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
    return res.json({data: serialize(doc, req.user)});
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

  return router;
}
