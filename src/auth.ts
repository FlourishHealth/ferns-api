import express from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import {Model, ObjectId} from "mongoose";
import passport from "passport";
import {Strategy as AnonymousStrategy} from "passport-anonymous";
import {JwtFromRequestFunction, Strategy as JwtStrategy, StrategyOptions} from "passport-jwt";
import {Strategy as LocalStrategy} from "passport-local";

import {APIError, apiErrorMiddleware} from "./errors";
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
    failureMessage: true,
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

const getTokenOptions = () => {
  const tokenOptions: jwt.SignOptions = {
    expiresIn: "15m",
  };
  if (process.env.TOKEN_EXPIRES_IN) {
    tokenOptions.expiresIn = process.env.TOKEN_EXPIRES_IN;
  }
  if (process.env.TOKEN_ISSUER) {
    tokenOptions.issuer = process.env.TOKEN_ISSUER;
  }
  return tokenOptions;
};

const generateTokens = async (user: any) => {
  const tokenSecretOrKey = process.env.TOKEN_SECRET;
  if (!tokenSecretOrKey) {
    throw new Error(`TOKEN_SECRET must be set in env.`);
  }
  const token = jwt.sign({id: user._id.toString()}, tokenSecretOrKey, getTokenOptions());
  const refreshTokenSecretOrKey = process.env.REFRESH_TOKEN_SECRET;
  let refreshToken;
  if (refreshTokenSecretOrKey) {
    const refreshTokenOptions: jwt.SignOptions = {
      expiresIn: "30d",
    };
    if (process.env.REFRESH_TOKEN_EXPIRES_IN) {
      refreshTokenOptions.expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;
    }
    refreshToken = jwt.sign(
      {id: user._id.toString()},
      refreshTokenSecretOrKey,
      refreshTokenOptions
    );
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
          return done(e);
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
    logger.debug("Setting up JWT Authentication");

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
          logger.warn(`[jwt] Error finding user from id: ${e}`);
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

  // Adds req.user to the request. This may wind up duplicating requests with passport,
  // but passport doesn't give us req.user early enough. TODO:
  // move info required for good logging (admin/testUser/type) into the JWT token.
  async function decodeJWTMiddleware(req, res, next) {
    if (!process.env.TOKEN_SECRET) {
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
      decoded = jwt.verify(token, process.env.TOKEN_SECRET, getTokenOptions()) as jwt.JwtPayload;
    } catch (error) {
      // Ignore the error here, the rest of the auth handler will handle it gracefully.
      return;
    }
    if (decoded.id) {
      try {
        req.user = await userModel.findById(decoded.id);
      } catch (error) {
        logger.warn(`[jwt] Error finding user from id: ${e}`);
      }
    }
    return next();
  }
  app.use(decodeJWTMiddleware);
  app.use(express.urlencoded({extended: false}) as any);
}

export function addAuthRoutes(app: express.Application, userModel: UserModel): void {
  const router = express.Router();
  router.post("/login", async function (req, res, next) {
    passport.authenticate("local", {session: true}, async (err: any, user: any, info: any) => {
      if (err) {
        logger.error(`Error logging in: ${err}`);
        return next(err);
      }
      if (!user) {
        logger.warn(`Invalid login: ${info}`);
        return res.status(401).json({message: info?.message});
      }
      const tokens = await generateTokens(user);
      return res.json({
        data: {userId: user?._id, token: tokens.token, refreshToken: tokens.refreshToken},
      });
    })(req, res, next);
  });

  router.post("/refresh_token", async function (req, res) {
    if (!req.body.refreshToken) {
      return res
        .status(401)
        .json({message: "No refresh token provided, must provide refreshToken in body"});
    }
    if (!process.env.REFRESH_TOKEN_SECRET) {
      return res.status(401).json({message: "No REFRESH_TOKEN_SECRET set, cannot refresh token"});
    }
    const refreshTokenSecretOrKey = process.env.REFRESH_TOKEN_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(req.body.refreshToken, refreshTokenSecretOrKey) as JwtPayload;
    } catch (error) {
      logger.error(`Error refreshing token: ${e}`);
      return res.status(401).json({message: e?.message});
    }
    if (decoded && decoded.id) {
      const user = await userModel.findById(decoded.id);
      const tokens = await generateTokens(user);
      return res.json({data: {token: tokens.token, refreshToken: tokens.refreshToken}});
    }
    return res.status(401).json({message: "Invalid refresh token"});
  });

  const signupDisabled = process.env.SIGNUP_DISABLED === "true";
  if (!signupDisabled) {
    router.post(
      "/signup",
      passport.authenticate("signup", {session: false, failWithError: true}),
      async function (req: any, res: any) {
        const tokens = await generateTokens(req.user);
        return res.json({
          data: {userId: req.user._id, token: tokens.token, refreshToken: tokens.refreshToken},
        });
      }
    );
  }

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
      return res.status(403).send({message: (e as any).message});
    }
  });

  app.set("etag", false);
  app.use("/auth", router);
  app.use(apiErrorMiddleware);
}
