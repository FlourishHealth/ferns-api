import express from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import {Model, ObjectId} from "mongoose";
import ms, {StringValue} from "ms";
import passport from "passport";
import {Strategy as AnonymousStrategy} from "passport-anonymous";
import {JwtFromRequestFunction, Strategy as JwtStrategy, StrategyOptions} from "passport-jwt";
import {Strategy as LocalStrategy} from "passport-local";

import {APIError, apiErrorMiddleware} from "./errors";
import {AuthOptions} from "./expressServer";
import {logger} from "./logger";
import {UserModel} from "./tests";

export interface User {
  _id: ObjectId | string;
  id: string;
  // Whether the user should be treated as an admin or not.
  // Admins can have extra abilities in permissions declarations
  admin: boolean;
  /**
   * We support anonymous users, which do not yet have login information.
   * This can be helpful for pre-signup users.
   */
  isAnonymous?: boolean;
}

export interface UserModel extends Model<User> {
  createAnonymousUser?: (id?: string) => Promise<User>;
  // Allows additional setup during signup. This will be passed the rest of req.body from the signup
  postCreate?: (body: any) => Promise<void>;

  createStrategy(): any;
  serializeUser(): any;
  deserializeUser(): any;
  findByUsername(username: string, findOpts: any): any;
}

export function authenticateMiddleware(anonymous = false) {
  const strategies = ["jwt"];
  if (anonymous) {
    strategies.push("anonymous");
  }
  return passport.authenticate(strategies, {
    session: false,
    failureMessage: false, // this is just avoiding storing the message in the session
    failWithError: true,
  });
}

export async function signupUser(
  userModel: UserModel,
  email: string,
  password: string,
  body?: any
) {
  // Strip email and password from the body. They can cause mongoose to throw an error if strict is
  // set.
  const {email: _email, password: _password, ...bodyRest} = body;

  try {
    const user = await (userModel as any).register({email, ...bodyRest}, password);

    if (user.postCreate) {
      try {
        await user.postCreate(bodyRest);
      } catch (error: any) {
        logger.error(`Error in user.postCreate: ${error}`);
        throw error;
      }
    }
    await user.save();
    return user;
  } catch (error: any) {
    throw new APIError({title: error.message});
  }
}

/**
 * Generates both an access token (JWT) and a refresh token for a given user.
 *
 * This function:
 * - Signs the user's `_id` into a short-lived JWT (`token`)
 *   and a long-lived refresh token (`refreshToken`).
 * - Supports custom expiration logic
 *   and payload customization via `AuthOptions`.
 * - Reads token secrets, issuer,
 *   and default expirations from environment variables.
 * - Returns `{ token, refreshToken }`,
 *   or `{ token: null, refreshToken: null }` if the user is missing.
 *
 * It is exported to allow external implementations (such as OAuth integrations or other
 * authentication providers) to reuse and customize the same token generation logic.
 * This ensures consistent and secure token issuance across different authentication flows.
 */
export const generateTokens = async (user: any, authOptions?: AuthOptions) => {
  const tokenSecretOrKey = process.env.TOKEN_SECRET;
  if (!tokenSecretOrKey) {
    throw new Error(`TOKEN_SECRET must be set in env.`);
  }
  if (!user?._id) {
    logger.warn("No user found for token generation");
    return {token: null, refreshToken: null};
  }
  let payload: Record<string, any> = {id: user._id.toString()};
  if (authOptions?.generateJWTPayload) {
    payload = {...authOptions.generateJWTPayload(user), ...payload};
  }
  const tokenOptions: jwt.SignOptions = {
    expiresIn: "15m",
  };
  if (authOptions?.generateTokenExpiration) {
    tokenOptions.expiresIn = authOptions.generateTokenExpiration(user);
  } else if (process.env.TOKEN_EXPIRES_IN) {
    try {
      // this call to ms is purely for validation of the env variable. If it is invalid,
      // we want to be able to log the error and use the default.
      ms(process.env.TOKEN_EXPIRES_IN as StringValue);
      tokenOptions.expiresIn = process.env.TOKEN_EXPIRES_IN as StringValue;
    } catch (error) {
      // This error will result in using the default value above of 15m.
      logger.error(error as string);
    }
  }
  if (process.env.TOKEN_ISSUER) {
    tokenOptions.issuer = process.env.TOKEN_ISSUER;
  }

  const token = jwt.sign(payload, tokenSecretOrKey, tokenOptions);
  const refreshTokenSecretOrKey = process.env.REFRESH_TOKEN_SECRET;
  let refreshToken;
  if (refreshTokenSecretOrKey) {
    const refreshTokenOptions: jwt.SignOptions = {
      expiresIn: "30d",
    };
    if (authOptions?.generateRefreshTokenExpiration) {
      refreshTokenOptions.expiresIn = authOptions.generateRefreshTokenExpiration(user);
    } else if (process.env.REFRESH_TOKEN_EXPIRES_IN) {
      try {
        // this call to ms is purely for validation of the env variable. If it is invalid,
        // we want to be able to log the error and use the default.
        ms(process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue);
        refreshTokenOptions.expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue;
      } catch (error) {
        // This error will result in using the default value above of 30d.
        logger.error(error as string);
      }
    }
    refreshToken = jwt.sign(payload, refreshTokenSecretOrKey, refreshTokenOptions);
  } else {
    logger.info("REFRESH_TOKEN_SECRET not set so refresh tokens will not be issued");
  }
  return {token, refreshToken};
};

// TODO allow customization
export function setupAuth(app: express.Application, userModel: UserModel) {
  passport.use(new AnonymousStrategy());
  passport.use(userModel.createStrategy());
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
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  if (!userModel.createStrategy) {
    throw new Error("setupAuth userModel must have .createStrategy()");
  }

  const customTokenExtractor: JwtFromRequestFunction = function (req) {
    let token: string | null = null;
    if (req?.cookies?.jwt) {
      token = req.cookies.jwt;
    } else if (req?.headers?.authorization) {
      token = req?.headers?.authorization.split(" ")[1];
    }
    return token;
  };

  if (process.env.TOKEN_SECRET) {
    if (process.env.NODE_ENV !== "test") {
      logger.debug("Setting up JWT Authentication");
    }

    const secretOrKey = process.env.TOKEN_SECRET;
    if (!secretOrKey) {
      throw new Error(`TOKEN_SECRET must be set in env.`);
    }
    const jwtOpts: StrategyOptions = {
      jwtFromRequest: customTokenExtractor,
      secretOrKey,
      issuer: process.env.TOKEN_ISSUER,
    };
    passport.use(
      "jwt",
      new JwtStrategy(jwtOpts, async function (jwtPayload: JwtPayload, done) {
        let user;
        if (!jwtPayload) {
          return done(null, false);
        }
        try {
          user = await userModel.findById(jwtPayload.id);
        } catch (error) {
          logger.warn(`[jwt] Error finding user from id: ${error}`);
          return done(error, false);
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

  // Adds req.user to the request. This may wind up duplicating requests with passport,
  // but passport doesn't give us req.user early enough.
  async function decodeJWTMiddleware(req, res, next) {
    if (!process.env.TOKEN_SECRET) {
      return next();
    }

    // Allow requests with a "Secret" prefix to pass through since this is a string value,
    // not a jwt that needs to be decoded
    if (req?.headers?.authorization?.split(" ")[0] === "Secret") {
      return next();
    }

    const token = customTokenExtractor(req);

    // For some reason, our app will happily put null into the authorization header when logging
    // out then back in.
    if (!token || token === "null" || token === "undefined") {
      return next();
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.TOKEN_SECRET, {
        issuer: process.env.TOKEN_ISSUER,
      }) as jwt.JwtPayload;
    } catch (error: any) {
      const userText = req.user?._id ? ` for user ${req.user._id} ` : "";
      const details = `[jwt] Error decoding token${userText}: ${error}, expired at ${error?.expiredAt}, current time: ${Date.now()}`;
      logger.debug(details);
      return res.status(401).json({message: error?.message, details});
    }
    if (decoded.id) {
      try {
        req.user = await userModel.findById(decoded.id);
        if (req.user?.disabled) {
          logger.warn(`[jwt] User ${req.user.id} is disabled`);
          return res.status(401).json({status: 401, title: "User is disabled"});
        }
      } catch (error) {
        logger.warn(`[jwt] Error finding user from id: ${error}`);
      }
    }
    return next();
  }
  app.use(decodeJWTMiddleware);
  app.use(express.urlencoded({extended: false}) as any);
}

export function addAuthRoutes(
  app: express.Application,
  userModel: UserModel,
  authOptions?: AuthOptions
): void {
  const router = express.Router();
  router.post("/login", async function (req, res, next) {
    passport.authenticate("local", {session: false}, async (err: any, user: any, info: any) => {
      if (err) {
        logger.error(`Error logging in: ${err}`);
        return next(err);
      }
      if (!user) {
        logger.warn(`Invalid login: ${info}`);
        return res.status(401).json({message: info?.message});
      }
      const tokens = await generateTokens(user, authOptions);
      return res.json({
        data: {userId: user?._id, token: tokens.token, refreshToken: tokens.refreshToken},
      });
    })(req, res, next);
  });

  router.post("/refresh_token", async function (req, res) {
    if (!req.body.refreshToken) {
      logger.error(
        `No refresh token provided, must provide refreshToken in body, user id: ${req.user?.id}`
      );
      return res
        .status(401)
        .json({message: "No refresh token provided, must provide refreshToken in body"});
    }
    if (!process.env.REFRESH_TOKEN_SECRET) {
      logger.error(`No REFRESH_TOKEN_SECRET set, cannot refresh token, user id: ${req.user?.id}`);
      return res.status(401).json({message: "No REFRESH_TOKEN_SECRET set, cannot refresh token"});
    }
    const refreshTokenSecretOrKey = process.env.REFRESH_TOKEN_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(req.body.refreshToken, refreshTokenSecretOrKey) as JwtPayload;
    } catch (error: any) {
      logger.error(`Error refreshing token for user ${req.user?.id}: ${error}`);
      return res.status(401).json({message: error?.message});
    }
    if (decoded && decoded.id) {
      const user = await userModel.findById(decoded.id);
      const tokens = await generateTokens(user, authOptions);
      logger.debug(`Refreshed token for ${user?.id}`);
      return res.json({data: {token: tokens.token, refreshToken: tokens.refreshToken}});
    }
    logger.error(`Invalid refresh token, user id: ${req.user?.id}`);
    return res.status(401).json({message: "Invalid refresh token"});
  });

  const signupDisabled = process.env.SIGNUP_DISABLED === "true";
  if (!signupDisabled) {
    router.post(
      "/signup",
      passport.authenticate("signup", {session: false, failWithError: true}),
      async function (req: any, res: any) {
        const tokens = await generateTokens(req.user, authOptions);
        return res.json({
          data: {userId: req.user._id, token: tokens.token, refreshToken: tokens.refreshToken},
        });
      }
    );
  }
  app.set("etag", false);
  app.use("/auth", router);
}

export function addMeRoutes(
  app: express.Application,
  userModel: UserModel,
  _authOptions?: AuthOptions
): void {
  const router = express.Router();
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
    } catch (error) {
      return res.status(403).send({message: (error as any).message});
    }
  });

  app.set("etag", false);
  app.use("/auth", router);
  app.use(apiErrorMiddleware);
}
