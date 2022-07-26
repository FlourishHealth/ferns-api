import express from "express";
import {Model, ObjectId} from "mongoose";
import passport from "passport";
import {Strategy as AnonymousStrategy} from "passport-anonymous";
import {Strategy as JwtStrategy} from "passport-jwt";
import {Strategy as LocalStrategy} from "passport-local";

import {logger} from "./logger";

export interface User {
  _id: ObjectId | string;
  id: string;
  // Whether the user should be treated as an admin or not. Admins can have extra abilities in permissions
  // declarations
  admin: boolean;
  /** We support anonymous users, which do not yet have login information. This can be helpful for pre-signup users. */
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

  if (process.env.TOKEN_SECRET) {
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
    const secretOrKey = process.env.TOKEN_SECRET;
    if (!secretOrKey) {
      throw new Error(`TOKEN_SECRET must be set in env.`);
    }
    const jwtOpts = {
      // jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("Bearer"),
      jwtFromRequest: customExtractor,
      secretOrKey,
      issuer: process.env.TOKEN_ISSUER,
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
    passport.authenticate("login", {session: true}, (err: any, user: any, info: any) => {
      if (err) {
        logger.error("Error logging in:", err);
        return next(err);
      }
      if (!user) {
        logger.warn("Invalid login:", info);
        return res.status(401).json({message: info?.message});
      }
      return res.json({data: {userId: user?._id, token: (user as any)?.token}});
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

  app.use(express.urlencoded({extended: false}) as any);
  app.use(passport.initialize() as any);

  app.set("etag", false);
  app.use("/auth", router);
}
