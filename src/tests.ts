import express, {Express} from "express";
import mongoose, {model, Schema} from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import supertest from "supertest";

import {createdUpdatedPlugin} from "./plugins";

mongoose.connect("mongodb://localhost:27017/ferns");

export interface User {
  admin: boolean;
  username: string;
  email: string;
  age?: number;
}

export interface SuperUser extends User {
  superTitle: string;
}

export interface StaffUser extends User {
  department: string;
}

export interface FoodCategory {
  _id?: string;
  name: string;
  show: boolean;
}

export interface Food {
  _id: string;
  name: string;
  calories: number;
  created: Date;
  ownerId: mongoose.Types.ObjectId | User;
  hidden?: boolean;
  source: {
    name: string;
  };
  tags: string[];
  categories: FoodCategory[];
}

const userSchema = new Schema<User>({
  username: String,
  admin: {type: Boolean, default: false},
  age: Number,
});

userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  limitAttempts: true,
  attemptsField: "attempts",
  maxAttempts: 3,
  usernameCaseInsensitive: true,
  interval: process.env.NODE_ENV === "test" ? 1 : 100,
  maxInterval: process.env.NODE_ENV === "test" ? 1 : 300000,
});
// userSchema.plugin(tokenPlugin);
userSchema.plugin(createdUpdatedPlugin);
userSchema.methods.postCreate = async function (body: any) {
  this.age = body.age;
  return this.save();
};

export const UserModel = model<User>("User", userSchema);

const superUserSchema = new Schema<SuperUser>({
  superTitle: {type: String, required: true},
});
export const SuperUserModel = UserModel.discriminator("SuperUser", superUserSchema);

const staffUserSchema = new Schema<StaffUser>({
  department: {type: String, required: true},
});
export const StaffUserModel = UserModel.discriminator("Staff", staffUserSchema);

const foodCategorySchema = new Schema<FoodCategory>(
  {
    name: String,
    show: Boolean,
  },
  {strict: "throw"}
);

const foodSchema = new Schema<Food>(
  {
    name: String,
    calories: Number,
    created: Date,
    ownerId: {type: "ObjectId", ref: "User"},
    source: {
      name: String,
    },
    hidden: {type: Boolean, default: false},
    tags: [String],
    categories: [foodCategorySchema],
  },
  {strict: "throw"}
);

export const FoodModel = model<Food>("Food", foodSchema);

interface RequiredField {
  name: string;
  about?: string;
}

const requiredSchema = new Schema<RequiredField>(
  {
    name: {type: String, required: true},
    about: String,
  },
  {strict: "throw"}
);
export const RequiredModel = model<RequiredField>("Required", requiredSchema);

export function getBaseServer(): Express {
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
  return app;
}

afterAll(() => {
  mongoose.connection.close();
});

export async function authAsUser(
  app: express.Application,
  type: "admin" | "notAdmin"
): Promise<supertest.SuperAgentTest> {
  const email = type === "admin" ? "admin@example.com" : "notAdmin@example.com";
  const password = type === "admin" ? "securePassword" : "password";

  const agent = supertest.agent(app);
  const res = await agent.post("/auth/login").send({email, password}).expect(200);
  agent.set("authorization", `Bearer ${res.body.data.token}`);
  return agent;
}

export async function setupDb() {
  process.env.TOKEN_SECRET = "secret";
  process.env.TOKEN_EXPIRES_IN = "30m";
  process.env.TOKEN_ISSUER = "example.com";
  process.env.SESSION_SECRET = "session";

  try {
    await Promise.all([UserModel.deleteMany({}), FoodModel.deleteMany({})]);
    const [notAdmin, admin, adminOther] = await Promise.all([
      UserModel.create({email: "notAdmin@example.com"}),
      UserModel.create({email: "admin@example.com", admin: true}),
      UserModel.create({email: "admin+other@example.com", admin: true}),
    ]);
    await (notAdmin as any).setPassword("password");
    await notAdmin.save();

    await (admin as any).setPassword("securePassword");
    await admin.save();

    await (adminOther as any).setPassword("otherPassword");
    await adminOther.save();

    return [admin, notAdmin, adminOther];
  } catch (e) {
    console.error("Error setting up DB", e);
    throw e;
  }
}
