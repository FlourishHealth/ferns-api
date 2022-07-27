import {assert} from "chai";
import express from "express";
import {ObjectId} from "mongoose";
import supertest from "supertest";

import {fernsRouter} from "./api";
import {setupAuth} from "./auth";
import {Permissions} from "./permissions";
import {authAsUser, Food, FoodModel, getBaseServer, setupDb, UserModel} from "./tests";
import {AdminOwnerTransformer} from "./transformers";

describe("query and transform", function () {
  let notAdmin: any;
  let admin: any;
  let server: supertest.SuperTest<supertest.Test>;
  let app: express.Application;

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
          create: [Permissions.IsAny],
          read: [Permissions.IsAny],
          update: [Permissions.IsAny],
          delete: [Permissions.IsAny],
        },
        queryFilter: (user?: {_id: ObjectId | string; admin: boolean}) => {
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

  it("filters list for non-admin", async function () {
    const agent = await authAsUser(app, "notAdmin");
    const foodRes = await agent.get("/food").expect(200);
    assert.lengthOf(foodRes.body.data, 2);
  });

  it("does not filter list for admin", async function () {
    const agent = await authAsUser(app, "admin");
    const foodRes = await agent.get("/food").expect(200);
    assert.lengthOf(foodRes.body.data, 3);
  });

  it("admin read transform", async function () {
    const agent = await authAsUser(app, "admin");
    const foodRes = await agent.get("/food").expect(200);
    assert.lengthOf(foodRes.body.data, 3);
    const spinach = foodRes.body.data.find((food: Food) => food.name === "Spinach");
    assert.isDefined(spinach.created);
    assert.isDefined(spinach.id);
    assert.isDefined(spinach.ownerId);
    assert.equal(spinach.name, "Spinach");
    assert.equal(spinach.calories, 1);
    assert.isUndefined(spinach.hidden);
  });

  it("admin write transform", async function () {
    const agent = await authAsUser(app, "admin");
    const foodRes = await agent.get("/food").expect(200);
    const spinach = foodRes.body.data.find((food: Food) => food.name === "Spinach");
    const spinachRes = await agent.patch(`/food/${spinach.id}`).send({name: "Lettuce"}).expect(200);
    assert.equal(spinachRes.body.data.name, "Lettuce");
  });

  it("owner read transform", async function () {
    const agent = await authAsUser(app, "notAdmin");
    const foodRes = await agent.get("/food").expect(200);
    assert.lengthOf(foodRes.body.data, 2);
    const spinach = foodRes.body.data.find((food: Food) => food.name === "Spinach");
    assert.isDefined(spinach.id);
    assert.equal(spinach.name, "Spinach");
    assert.equal(spinach.calories, 1);
    assert.isDefined(spinach.created);
    assert.isDefined(spinach.ownerId);
    assert.isUndefined(spinach.hidden);
  });

  it("owner write transform", async function () {
    const agent = await authAsUser(app, "notAdmin");
    const foodRes = await agent.get("/food").expect(200);
    const spinach = foodRes.body.data.find((food: Food) => food.name === "Spinach");
    await agent.patch(`/food/${spinach.id}`).send({ownerId: admin.id}).expect(403);
  });

  it("owner write transform fails", async function () {
    const agent = await authAsUser(app, "notAdmin");
    const foodRes = await agent.get("/food").expect(200);
    const spinach = foodRes.body.data.find((food: Food) => food.name === "Spinach");
    const spinachRes = await agent
      .patch(`/food/${spinach.id}`)
      .send({ownerId: notAdmin.id})
      .expect(403);
    assert.equal(spinachRes.body.message, "User of type owner cannot write fields: ownerId");
  });

  it("auth read transform", async function () {
    const agent = await authAsUser(app, "notAdmin");
    const foodRes = await agent.get("/food").expect(200);
    assert.lengthOf(foodRes.body.data, 2);
    const spinach = foodRes.body.data.find((food: Food) => food.name === "Spinach");
    assert.isDefined(spinach.id);
    assert.equal(spinach.name, "Spinach");
    assert.equal(spinach.calories, 1);
    assert.isDefined(spinach.created);
    // Owner, so this is defined.
    assert.isDefined(spinach.ownerId);
    assert.isUndefined(spinach.hidden);

    const carrots = foodRes.body.data.find((food: Food) => food.name === "Carrots");
    assert.isDefined(carrots.id);
    assert.equal(carrots.name, "Carrots");
    assert.equal(carrots.calories, 100);
    assert.isDefined(carrots.created);
    // Not owner, so undefined.
    assert.isUndefined(carrots.ownerId);
    assert.isUndefined(spinach.hidden);
  });

  it("auth write transform", async function () {
    const agent = await authAsUser(app, "notAdmin");
    const foodRes = await agent.get("/food");
    const carrots = foodRes.body.data.find((food: Food) => food.name === "Carrots");
    const carrotRes = await agent.patch(`/food/${carrots.id}`).send({calories: 2000}).expect(200);
    assert.equal(carrotRes.body.data.calories, 2000);
  });

  it("auth write transform fail", async function () {
    const agent = await authAsUser(app, "notAdmin");
    const foodRes = await agent.get("/food");
    const carrots = foodRes.body.data.find((food: Food) => food.name === "Carrots");
    const writeRes = await agent
      .patch(`/food/${carrots.id}`)
      .send({created: "2020-01-01T00:00:00Z"})
      .expect(403);
    assert.equal(writeRes.body.message, "User of type auth cannot write fields: created");
  });

  it("anon read transform", async function () {
    const res = await server.get("/food");
    assert.lengthOf(res.body.data, 2);
    assert.isDefined(res.body.data.find((f: Food) => f.name === "Spinach"));
    assert.isDefined(res.body.data.find((f: Food) => f.name === "Carrots"));
  });

  it("anon write transform fails", async function () {
    const foodRes = await server.get("/food");
    const carrots = foodRes.body.data.find((food: Food) => food.name === "Carrots");
    await server.patch(`/food/${carrots.id}`).send({calories: 10}).expect(403);
  });
});
