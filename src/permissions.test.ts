import {assert} from "chai";
import express from "express";
import supertest from "supertest";

import {fernsRouter} from "./api";
import {setupAuth} from "./auth";
import {Permissions} from "./permissions";
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
  let server: supertest.SuperTest<supertest.Test>;
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
    let agent: supertest.SuperAgentTest;
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
    let agent: supertest.SuperAgentTest;

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
});
