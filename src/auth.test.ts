import {assert} from "chai";
import express from "express";
import supertest from "supertest";

import {fernsRouter} from "./api";
import {setupAuth} from "./auth";
import {Permissions} from "./permissions";
import {Food, FoodModel, getBaseServer, setupDb, UserModel} from "./tests";
import {AdminOwnerTransformer} from "./transformers";

describe("auth tests", function () {
  let app: express.Application;
  let server: any;
  let admin: any;
  let notAdmin: any;

  beforeEach(async function () {
    [admin, notAdmin] = await setupDb();

    await Promise.all([
      FoodModel.create({
        name: "Spinach",
        calories: 1,
        created: new Date(),
        ownerId: notAdmin._id,
      }),
      FoodModel.create({
        name: "Apple",
        calories: 100,
        created: new Date().getTime() - 10,
        ownerId: admin._id,
        hidden: true,
      }),
      FoodModel.create({
        name: "Carrots",
        calories: 100,
        created: new Date().getTime() - 10,
        ownerId: admin._id,
      }),
    ]);
    app = getBaseServer();
    setupAuth(app, UserModel as any);
    app.use(
      "/food",
      fernsRouter(FoodModel, {
        permissions: {
          list: [Permissions.IsAny],
          create: [Permissions.IsAuthenticated],
          read: [Permissions.IsAny],
          update: [Permissions.IsAuthenticated],
          delete: [Permissions.IsAuthenticated],
        },
        queryFilter: (user?: {admin: boolean}) => {
          if (!user?.admin) {
            return {hidden: {$ne: true}};
          }
          return {};
        },
        transformer: AdminOwnerTransformer<Food>({
          adminReadFields: ["name", "calories", "created", "ownerId"],
          adminWriteFields: ["name", "calories", "created", "ownerId"],
          ownerReadFields: ["name", "calories", "created", "ownerId"],
          ownerWriteFields: ["name", "calories", "created"],
          authReadFields: ["name", "calories", "created"],
          authWriteFields: ["name", "calories"],
          anonReadFields: ["name"],
          anonWriteFields: [],
        }),
      })
    );
    server = supertest(app);
  });

  it("completes token signup e2e", async function () {
    const agent = supertest.agent(app);
    let res = await server
      .post("/auth/signup")
      .send({email: "new@example.com", password: "123"})
      .expect(200);
    let {userId, token} = res.body.data;
    assert.isDefined(userId);
    assert.isDefined(token);

    res = await server
      .post("/auth/login")
      .send({email: "new@example.com", password: "123"})
      .expect(200);
    agent.set("authorization", `Bearer ${res.body.data.token}`);

    userId = res.body.data.userId;
    token = res.body.data.token;
    assert.isDefined(userId);
    assert.isDefined(token);

    const food = await FoodModel.create({
      name: "Peas",
      calories: 1,
      created: new Date(),
      ownerId: userId,
    });

    const meRes = await agent.get("/auth/me").expect(200);
    assert.isDefined(meRes.body.data._id);
    assert.isDefined(meRes.body.data.id);
    assert.isUndefined(meRes.body.data.hash);
    assert.equal(meRes.body.data.email, "new@example.com");
    assert.isDefined(meRes.body.data.token);
    assert.isDefined(meRes.body.data.updated);
    assert.isDefined(meRes.body.data.created);
    assert.isFalse(meRes.body.data.admin);

    const mePatchRes = await server
      .patch("/auth/me")
      .send({email: "new2@example.com"})
      .set("authorization", `Bearer ${token}`)
      .expect(200);
    assert.isDefined(mePatchRes.body.data._id);
    assert.isDefined(mePatchRes.body.data.id);
    assert.isUndefined(mePatchRes.body.data.hash);
    assert.equal(mePatchRes.body.data.email, "new2@example.com");
    assert.isDefined(mePatchRes.body.data.token);
    assert.isDefined(mePatchRes.body.data.updated);
    assert.isDefined(mePatchRes.body.data.created);
    assert.isFalse(mePatchRes.body.data.admin);

    // Use token to see 2 foods + the one we just created
    const getRes = await agent.get("/food").expect(200);

    assert.lengthOf(getRes.body.data, 3);
    assert.isDefined(getRes.body.data.find((f: any) => f.name === "Peas"));

    const updateRes = await agent
      .patch(`/food/${food._id}`)
      .send({name: "PeasAndCarrots"})
      .expect(200);
    assert.equal(updateRes.body.data.name, "PeasAndCarrots");
  });

  it("signup with extra data", async function () {
    const res = await server
      .post("/auth/signup")
      .send({email: "new@example.com", password: "123", age: 25})
      .expect(200);
    const {userId, token} = res.body.data;
    assert.isDefined(userId);
    assert.isDefined(token);

    const user = await UserModel.findOne({email: "new@example.com"});
    assert.equal(user?.age, 25);
  });

  it("login failure", async function () {
    let res = await server
      .post("/auth/login")
      .send({email: "admin@example.com", password: "wrong"})
      .expect(401);
    assert.deepEqual(res.body, {message: "Password is incorrect"});
    res = await server
      .post("/auth/login")
      .send({email: "nope@example.com", password: "wrong"})
      .expect(401);
    assert.deepEqual(res.body, {message: "User Not Found"});
  });

  it("completes token login e2e", async function () {
    const agent = supertest.agent(app);
    const res = await agent
      .post("/auth/login")
      .send({email: "admin@example.com", password: "securePassword"})
      .expect(200);
    const {userId, token} = res.body.data;
    assert.isDefined(userId);
    assert.isDefined(token);

    agent.set("authorization", `Bearer ${res.body.data.token}`);

    const meRes = await agent.get("/auth/me").expect(200);
    assert.isDefined(meRes.body.data._id);
    assert.isDefined(meRes.body.data.id);
    assert.isUndefined(meRes.body.data.hash);
    assert.equal(meRes.body.data.email, "admin@example.com");
    assert.isDefined(meRes.body.data.token);
    assert.isDefined(meRes.body.data.updated);
    assert.isDefined(meRes.body.data.created);
    assert.isTrue(meRes.body.data.admin);

    const mePatchRes = await agent
      .patch("/auth/me")
      .send({email: "admin2@example.com"})
      .expect(200);
    assert.isDefined(mePatchRes.body.data._id);
    assert.isDefined(mePatchRes.body.data.id);
    assert.isUndefined(mePatchRes.body.data.hash);
    assert.equal(mePatchRes.body.data.email, "admin2@example.com");
    assert.isDefined(mePatchRes.body.data.token);
    assert.isDefined(mePatchRes.body.data.updated);
    assert.isDefined(mePatchRes.body.data.created);
    assert.isTrue(mePatchRes.body.data.admin);

    // Use token to see admin foods
    const getRes = await agent.get("/food").expect(200);

    assert.lengthOf(getRes.body.data, 3);
    const food = getRes.body.data.find((f: any) => f.name === "Apple");
    assert.isDefined(food);

    const updateRes = await server
      .patch(`/food/${food.id}`)
      .set("authorization", `Bearer ${token}`)
      .send({name: "Apple Pie"})
      .expect(200);
    assert.equal(updateRes.body.data.name, "Apple Pie");
  });

  it("locks out after failed password attempts", async function () {
    let res = await server
      .post("/auth/login")
      .send({email: "admin@example.com", password: "wrong"})
      .expect(401);
    assert.deepEqual(res.body, {message: "Password is incorrect"});
    let user = await UserModel.findById(admin._id);
    assert.equal((user as any)?.attempts, 1);
    res = await server
      .post("/auth/login")
      .send({email: "admin@example.com", password: "wrong"})
      .expect(401);
    assert.deepEqual(res.body, {message: "Password is incorrect"});
    user = await UserModel.findById(admin._id);
    assert.equal((user as any)?.attempts, 2);
    res = await server
      .post("/auth/login")
      .send({email: "admin@example.com", password: "wrong"})
      .expect(401);
    assert.deepEqual(res.body, {message: "Account locked due to too many failed login attempts"});
    user = await UserModel.findById(admin._id);
    assert.equal((user as any)?.attempts, 3);

    // Logging in with correct password fails because account is locked
    res = await server
      .post("/auth/login")
      .send({email: "admin@example.com", password: "securePassword"})
      .expect(401);
    assert.deepEqual(res.body, {message: "Account locked due to too many failed login attempts"});
    user = await UserModel.findById(admin._id);
    // Not incremented
    assert.equal((user as any)?.attempts, 3);
  });
});
