import express from "express";
import mongoose, {model, Schema} from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

import {fernsRouter, FernsRouterOptions} from "./api";
import {addAuthRoutes, setupAuth} from "./auth";
import {APIError} from "./errors";
import {setupServer} from "./expressServer";
import {logger} from "./logger";
import {Permissions} from "./permissions";
import {baseUserPlugin, createdUpdatedPlugin} from "./plugins";

mongoose
  .connect("mongodb://localhost:27017/example")
  .then(() => {
    logger.debug("Connected to mongo");
  })
  .catch((err) => {
    logger.error(`Error connecting to mongo ${err}`);
  });

interface User {
  admin: boolean;
  username: string;
}

interface Food {
  name: string;
  calories: number;
  created: Date;
  ownerId: mongoose.Types.ObjectId | User;
  hidden?: boolean;
}

const userSchema = new Schema<User>({
  username: String,
  admin: {type: Boolean, default: false},
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});
userSchema.plugin(createdUpdatedPlugin);
userSchema.plugin(baseUserPlugin);
const UserModel = model<User>("User", userSchema);

const schema = new Schema<Food>({
  name: String,
  calories: Number,
  created: Date,
  ownerId: {type: "ObjectId", ref: "User"},
  hidden: {type: Boolean, default: false},
});

const FoodModel = model<Food>("Food", schema);

function getBaseServer() {
  const app = express();

  app.all("/*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    // intercepts OPTIONS method
    if (req.method === "OPTIONS") {
      res.send(200);
    } else {
      next();
    }
  });
  app.use(express.json());
  setupAuth(app, UserModel as any);
  addAuthRoutes(app, UserModel as any);

  function addRoutes(router: express.Router, options?: Partial<FernsRouterOptions<any>>): void {
    router.use(
      "/food",
      fernsRouter(FoodModel, {
        ...options,
        permissions: {
          list: [Permissions.IsAny],
          create: [Permissions.IsAuthenticated],
          read: [Permissions.IsAny],
          update: [Permissions.IsOwner],
          delete: [Permissions.IsAdmin],
        },
        queryFields: ["name", "calories", "created", "ownerId", "hidden"],
        openApiOverwrite: {
          get: {responses: {200: {description: "Get all the food"}}},
        },
      })
    );

    // use this to test generating an APIError
    router.use("/error", function () {
      // const error = new Error("example test error contents");
      console.debug("does this show up in sentry?");
      throw new APIError({
        name: "Test Error",
        status: 500,
        code: "test-error",
        message: "This is a test error",
      });
    });
  }

  return setupServer({
    userModel: UserModel as any,
    addRoutes,
    loggingOptions: {
      level: "debug",
    },
  });
}
getBaseServer();
