import {jest} from "@jest/globals";
import {assert} from "chai";
import express from "express";
import {model, Schema} from "mongoose";
import supertest from "supertest";
import TestAgent from "supertest/lib/agent";

import {fernsRouter} from "./api";
import {addAuthRoutes, setupAuth} from "./auth";
import {APIError} from "./errors";
import {permissionMiddleware, Permissions} from "./permissions";
import {isDeletedPlugin} from "./plugins";
import {
  authAsUser,
  Food,
  FoodModel,
  getBaseServer,
  RequiredModel,
  setupDb,
  UserModel,
} from "./tests";

describe("permissions", function () {
  let server: TestAgent;
  let app: express.Application;

  beforeEach(async function () {
    process.env.REFRESH_TOKEN_SECRET = "testsecret1234";

    const [admin, notAdmin] = await setupDb();

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
      }),
    ]);
    app = getBaseServer();
    setupAuth(app, UserModel as any);
    addAuthRoutes(app, UserModel as any);
    app.use(
      "/food",
      fernsRouter(FoodModel, {
        allowAnonymous: true,
        permissions: {
          list: [Permissions.IsAny],
          create: [Permissions.IsAuthenticated],
          read: [Permissions.IsAny],
          update: [Permissions.IsOwner],
          delete: [Permissions.IsAdmin],
        },
      })
    );
    app.use(
      "/required",
      fernsRouter(RequiredModel, {
        permissions: {
          list: [Permissions.IsAny],
          create: [Permissions.IsAuthenticated],
          read: [Permissions.IsAny],
          update: [Permissions.IsOwner],
          delete: [Permissions.IsAdmin],
        },
      })
    );
    server = supertest(app);
  });

  describe("anonymous food", function () {
    it("list", async function () {
      const res = await server.get("/food").expect(200);
      assert.lengthOf(res.body.data, 2);
    });

    it("get", async function () {
      const res = await server.get("/food").expect(200);
      assert.lengthOf(res.body.data, 2);
      const res2 = await server.get(`/food/${res.body.data[0]._id}`).expect(200);
      assert.equal(res.body.data[0]._id, res2.body.data._id);
    });

    it("post", async function () {
      const res = await server.post("/food").send({
        name: "Broccoli",
        calories: 15,
      });
      assert.equal(res.status, 405);
    });

    it("patch", async function () {
      const res = await server.get("/food");
      const res2 = await server.patch(`/food/${res.body.data[0]._id}`).send({
        name: "Broccoli",
      });
      assert.equal(res2.status, 403);
    });

    it("delete", async function () {
      const res = await server.get("/food");
      const res2 = await server.delete(`/food/${res.body.data[0]._id}`);
      assert.equal(res2.status, 405);
    });
  });

  describe("non admin food", function () {
    let agent: TestAgent;

    beforeEach(async function () {
      agent = await authAsUser(app, "notAdmin");
    });

    it("list", async function () {
      const res = await agent.get("/food").expect(200);
      assert.lengthOf(res.body.data, 2);
    });

    it("get", async function () {
      const res = await agent.get("/food").expect(200);
      assert.lengthOf(res.body.data, 2);
      const res2 = await server.get(`/food/${res.body.data[0]._id}`).expect(200);
      assert.equal(res.body.data[0]._id, res2.body.data._id);
    });

    it("post", async function () {
      await agent
        .post("/food")
        .send({
          name: "Broccoli",
          calories: 15,
        })
        .expect(201);
    });

    it("patch own item", async function () {
      const res = await agent.get("/food");
      const spinach = res.body.data.find((food: Food) => food.name === "Spinach");
      const res2 = await agent
        .patch(`/food/${spinach._id}`)
        .send({
          name: "Broccoli",
        })
        .expect(200);
      assert.equal(res2.body.data.name, "Broccoli");
    });

    it("patch other item", async function () {
      const res = await agent.get("/food");
      const spinach = res.body.data.find((food: Food) => food.name === "Apple");
      await agent
        .patch(`/food/${spinach._id}`)
        .send({
          name: "Broccoli",
        })
        .expect(403);
    });

    it("delete", async function () {
      const res = await agent.get("/food");
      const res2 = await agent.delete(`/food/${res.body.data[0]._id}`);
      assert.equal(res2.status, 405);
    });
  });

  describe("admin food", function () {
    let agent: TestAgent;

    beforeEach(async function () {
      agent = await authAsUser(app, "admin");
    });

    it("list", async function () {
      const res = await agent.get("/food");
      assert.lengthOf(res.body.data, 2);
    });

    it("get", async function () {
      const res = await agent.get("/food");
      assert.lengthOf(res.body.data, 2);
      const res2 = await agent.get(`/food/${res.body.data[0]._id}`);
      assert.equal(res.body.data[0]._id, res2.body.data._id);
    });

    it("post", async function () {
      const res = await agent.post("/food").send({
        name: "Broccoli",
        calories: 15,
      });
      assert.equal(res.status, 201);
    });

    it("patch", async function () {
      const res = await agent.get("/food");
      await agent
        .patch(`/food/${res.body.data[0]._id}`)
        .send({
          name: "Broccoli",
        })
        .expect(200);
    });

    it("delete", async function () {
      const res = await agent.get("/food");
      await agent.delete(`/food/${res.body.data[0]._id}`).expect(204);
    });

    it("handles validation errors", async function () {
      await agent
        .post("/required")
        .send({
          about: "Whoops forgot required",
        })
        .expect(400);
    });
  });

  describe("permissionMiddleware", () => {
    const testSchema = new Schema({name: String});
    testSchema.plugin(isDeletedPlugin);
    const TestModel = model("Test", testSchema);

    beforeEach(async () => {
      await TestModel.deleteMany({});
    });

    it("returns 404 with context for hidden document", async () => {
      const doc = await TestModel.create({name: "test", deleted: true});
      const req = {
        params: {id: doc._id},
        method: "GET",
        user: undefined,
      } as unknown as express.Request;
      const res = {
        status: jest.fn(),
        sendStatus: jest.fn(),
        links: jest.fn(),
        send: jest.fn(),
      } as unknown as express.Response;
      const next = jest.fn();

      await permissionMiddleware(TestModel, {
        permissions: {
          create: [() => true],
          list: [() => true],
          read: [() => true],
          update: [() => true],
          delete: [() => true],
        },
      })(req, res, next);

      const error = next.mock.calls[0][0] as APIError;
      assert.equal(error.status, 404);
      assert.equal(error.title, `Document ${doc._id} not found for model Test`);
      assert.deepEqual(error.meta, {deleted: "true"});
    });

    it("returns 404 without meta for missing document", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const req = {
        params: {id: nonExistentId},
        method: "GET",
        user: undefined,
      } as unknown as express.Request;
      const res = {} as express.Response;
      const next = jest.fn();

      await permissionMiddleware(TestModel, {
        permissions: {
          create: [() => true],
          list: [() => true],
          read: [() => true],
          update: [() => true],
          delete: [() => true],
        },
      })(req, res, next);

      const error = next.mock.calls[0][0] as APIError;
      assert.equal(error.status, 404);
      assert.equal(error.title, `Document ${nonExistentId} not found for model Test`);
      assert.isUndefined(error.meta);
    });
  });
});
