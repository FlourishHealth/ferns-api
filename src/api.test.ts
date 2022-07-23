import chai from "chai";
import express from "express";
import sortBy from "lodash/sortBy";
import mongoose from "mongoose";
import qs from "qs";
import supertest from "supertest";

import {gooseRestRouter} from "./api";
import {setupAuth} from "./auth";
import {Permissions} from "./permissions";
import {
  authAsUser,
  Food,
  FoodModel,
  getBaseServer,
  setupDb,
  StaffUser,
  StaffUserModel,
  SuperUser,
  SuperUserModel,
  UserModel,
} from "./tests";

const assert = chai.assert;

describe("ferns-api", () => {
  let server: supertest.SuperTest<supertest.Test>;
  let app: express.Application;

  describe("pre and post hooks", function () {
    let agent: supertest.SuperAgentTest;

    beforeEach(async function () {
      await setupDb();
      app = getBaseServer();
      setupAuth(app, UserModel as any);
      agent = await authAsUser(app, "notAdmin");
    });

    it("pre hooks change data", async function () {
      let deleteCalled = false;
      app.use(
        "/food",
        gooseRestRouter(FoodModel, {
          permissions: {
            list: [Permissions.IsAny],
            create: [Permissions.IsAny],
            read: [Permissions.IsAny],
            update: [Permissions.IsAny],
            delete: [Permissions.IsAny],
          },
          preCreate: (data: any) => {
            data.calories = 14;
            return data;
          },
          preUpdate: (data: any) => {
            data.calories = 15;
            return data;
          },
          preDelete: (data: any) => {
            deleteCalled = true;
            return data;
          },
        })
      );
      server = supertest(app);

      let res = await server
        .post("/food")
        .send({
          name: "Broccoli",
          calories: 15,
        })
        .expect(201);
      const broccoli = await FoodModel.findById(res.body.data._id);
      if (!broccoli) {
        throw new Error("Broccoli was not created");
      }
      assert.equal(broccoli.name, "Broccoli");
      // Overwritten by the pre create hook
      assert.equal(broccoli.calories, 14);

      res = await server
        .patch(`/food/${broccoli._id}`)
        .send({
          name: "Broccoli2",
        })
        .expect(200);
      assert.equal(res.body.data.name, "Broccoli2");
      // Updated by the pre update hook
      assert.equal(res.body.data.calories, 15);

      await agent.delete(`/food/${broccoli._id}`).expect(204);
      assert.isTrue(deleteCalled);
    });

    it("pre hooks return null", async function () {
      const notAdmin = await UserModel.findOne({email: "notAdmin@example.com"});
      const spinach = await FoodModel.create({
        name: "Spinach",
        calories: 1,
        created: new Date("2021-12-03T00:00:20.000Z"),
        ownerId: (notAdmin as any)._id,
        hidden: false,
        source: {
          name: "Brand",
        },
      });

      app.use(
        "/food",
        gooseRestRouter(FoodModel, {
          permissions: {
            list: [Permissions.IsAny],
            create: [Permissions.IsAny],
            read: [Permissions.IsAny],
            update: [Permissions.IsAny],
            delete: [Permissions.IsAny],
          },
          preCreate: () => null,
          preUpdate: () => null,
          preDelete: () => null,
        })
      );
      server = supertest(app);

      const res = await server
        .post("/food")
        .send({
          name: "Broccoli",
          calories: 15,
        })
        .expect(403);
      const broccoli = await FoodModel.findById(res.body._id);
      assert.isNull(broccoli);

      await server
        .patch(`/food/${spinach._id}`)
        .send({
          name: "Broccoli",
        })
        .expect(403);

      await agent.delete(`/food/${spinach._id}`).expect(403);
    });

    it("post hooks succeed", async function () {
      let deleteCalled = false;
      app.use(
        "/food",
        gooseRestRouter(FoodModel, {
          permissions: {
            list: [Permissions.IsAny],
            create: [Permissions.IsAny],
            read: [Permissions.IsAny],
            update: [Permissions.IsAny],
            delete: [Permissions.IsAny],
          },
          postCreate: async (data: any) => {
            data.calories = 14;
            await data.save();
            return data;
          },
          postUpdate: async (data: any) => {
            data.calories = 15;
            await data.save();
            return data;
          },
          postDelete: (data: any) => {
            deleteCalled = true;
            return data;
          },
        })
      );
      server = supertest(app);

      let res = await server
        .post("/food")
        .send({
          name: "Broccoli",
          calories: 15,
        })
        .expect(201);
      let broccoli = await FoodModel.findById(res.body.data._id);
      if (!broccoli) {
        throw new Error("Broccoli was not created");
      }
      assert.equal(broccoli.name, "Broccoli");
      // Overwritten by the pre create hook
      assert.equal(broccoli.calories, 14);

      res = await server
        .patch(`/food/${broccoli._id}`)
        .send({
          name: "Broccoli2",
        })
        .expect(200);
      broccoli = await FoodModel.findById(res.body.data._id);
      if (!broccoli) {
        throw new Error("Broccoli was not update");
      }
      assert.equal(broccoli.name, "Broccoli2");
      // Updated by the post update hook
      assert.equal(broccoli.calories, 15);

      await agent.delete(`/food/${broccoli._id}`).expect(204);
      assert.isTrue(deleteCalled);
    });
  });

  describe("model array operations", function () {
    let admin: any;
    let spinach: Food;
    let apple: Food;
    let agent: supertest.SuperAgentTest;

    beforeEach(async function () {
      [admin] = await setupDb();

      [spinach, apple] = await Promise.all([
        FoodModel.create({
          name: "Spinach",
          calories: 1,
          created: new Date("2021-12-03T00:00:20.000Z"),
          ownerId: admin._id,
          hidden: false,
          source: {
            name: "Brand",
          },
        }),
        FoodModel.create({
          name: "Apple",
          calories: 100,
          created: new Date("2021-12-03T00:00:30.000Z"),
          ownerId: admin._id,
          hidden: false,
          categories: [
            {
              name: "Fruit",
              show: true,
            },
            {
              name: "Popular",
              show: false,
            },
          ],
          tags: ["healthy", "cheap"],
        }),
      ]);

      app = getBaseServer();
      setupAuth(app, UserModel as any);
      app.use(
        "/food",
        gooseRestRouter(FoodModel, {
          permissions: {
            list: [Permissions.IsAdmin],
            create: [Permissions.IsAdmin],
            read: [Permissions.IsAdmin],
            update: [Permissions.IsAdmin],
            delete: [Permissions.IsAdmin],
          },
          sort: {created: "descending"},
          queryFields: ["hidden", "calories", "created", "source.name"],
        })
      );
      server = supertest(app);
      agent = await authAsUser(app, "admin");
    });

    it("add array sub-schema item", async function () {
      // Incorrect way, should have "categories" as a top level key.
      let res = await agent
        .post(`/food/${apple._id}/categories`)
        .send({name: "Good Seller", show: false})
        .expect(400);
      assert.equal(
        res.body.title,
        "Malformed body, array operations should have a single, top level key, got: name,show"
      );

      res = await agent
        .post(`/food/${apple._id}/categories`)
        .send({categories: {name: "Good Seller", show: false}})
        .expect(200);
      assert.lengthOf(res.body.data.categories, 3);
      assert.equal(res.body.data.categories[2].name, "Good Seller");

      res = await agent
        .post(`/food/${spinach._id}/categories`)
        .send({categories: {name: "Good Seller", show: false}})
        .expect(200);
      assert.lengthOf(res.body.data.categories, 1);
    });

    it("update array sub-schema item", async function () {
      let res = await agent
        .patch(`/food/${apple._id}/categories/xyz`)
        .send({categories: {name: "Good Seller", show: false}})
        .expect(404);
      assert.equal(res.body.title, "Could not find categories/xyz");
      res = await agent
        .patch(`/food/${apple._id}/categories/${apple.categories[1]._id}`)
        .send({categories: {name: "Good Seller", show: false}})
        .expect(200);
      assert.lengthOf(res.body.data.categories, 2);
      assert.equal(res.body.data.categories[1].name, "Good Seller");
    });

    it("delete array sub-schema item", async function () {
      let res = await agent.delete(`/food/${apple._id}/categories/xyz`).expect(404);
      assert.equal(res.body.title, "Could not find categories/xyz");
      res = await agent
        .delete(`/food/${apple._id}/categories/${apple.categories[0]._id}`)
        .expect(200);
      assert.lengthOf(res.body.data.categories, 1);
      assert.equal(res.body.data.categories[0].name, "Popular");
    });

    it("add array item", async function () {
      let res = await agent.post(`/food/${apple._id}/tags`).send({tags: "popular"}).expect(200);
      assert.lengthOf(res.body.data.tags, 3);
      assert.deepEqual(res.body.data.tags, ["healthy", "cheap", "popular"]);

      res = await agent.post(`/food/${spinach._id}/tags`).send({tags: "popular"}).expect(200);
      assert.deepEqual(res.body.data.tags, ["popular"]);
    });

    it("update array item", async function () {
      let res = await agent
        .patch(`/food/${apple._id}/tags/xyz`)
        .send({tags: "unhealthy"})
        .expect(404);
      assert.equal(res.body.title, "Could not find tags/xyz");
      res = await agent
        .patch(`/food/${apple._id}/tags/healthy`)
        .send({tags: "unhealthy"})
        .expect(200);
      assert.deepEqual(res.body.data.tags, ["unhealthy", "cheap"]);
    });

    it("delete array item", async function () {
      let res = await agent.delete(`/food/${apple._id}/tags/xyz`).expect(404);
      assert.equal(res.body.title, "Could not find tags/xyz");
      res = await agent.delete(`/food/${apple._id}/tags/healthy`).expect(200);
      assert.deepEqual(res.body.data.tags, ["cheap"]);
    });
  });

  describe("list options", function () {
    let notAdmin: any;
    let admin: any;
    let agent: supertest.SuperAgentTest;

    let spinach: Food;
    let apple: Food;
    let carrots: Food;
    let pizza: Food;

    beforeEach(async function () {
      [admin, notAdmin] = await setupDb();

      [spinach, apple, carrots, pizza] = await Promise.all([
        FoodModel.create({
          name: "Spinach",
          calories: 1,
          created: new Date("2021-12-03T00:00:20.000Z"),
          ownerId: notAdmin._id,
          hidden: false,
          source: {
            name: "Brand",
          },
        }),
        FoodModel.create({
          name: "Apple",
          calories: 100,
          created: new Date("2021-12-03T00:00:30.000Z"),
          ownerId: admin._id,
          hidden: true,
        }),
        FoodModel.create({
          name: "Carrots",
          calories: 100,
          created: new Date("2021-12-03T00:00:00.000Z"),
          ownerId: admin._id,
          hidden: false,
          source: {
            name: "USDA",
          },
        }),
        FoodModel.create({
          name: "Pizza",
          calories: 400,
          created: new Date("2021-12-03T00:00:10.000Z"),
          ownerId: admin._id,
          hidden: false,
        }),
      ]);
      app = getBaseServer();
      setupAuth(app, UserModel as any);
      app.use(
        "/food",
        gooseRestRouter(FoodModel, {
          permissions: {
            list: [Permissions.IsAny],
            create: [Permissions.IsAuthenticated],
            read: [Permissions.IsAny],
            update: [Permissions.IsOwner],
            delete: [Permissions.IsAdmin],
          },
          defaultLimit: 2,
          maxLimit: 3,
          sort: {created: "descending"},
          defaultQueryParams: {hidden: false},
          queryFields: ["hidden", "calories", "created", "source.name"],
          populatePaths: ["ownerId"],
        })
      );
      server = supertest(app);
      agent = await authAsUser(app, "notAdmin");
    });

    it("list limit", async function () {
      const res = await agent.get("/food?limit=1").expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.equal(res.body.data[0].id, (spinach as any).id);
      assert.equal(res.body.data[0].ownerId._id, notAdmin.id);
      assert.isTrue(res.body.more);
    });

    it("list limit over", async function () {
      // This shouldn't be seen, it's the end of the list.
      await FoodModel.create({
        name: "Pizza",
        calories: 400,
        created: new Date("2021-12-02T00:00:10.000Z"),
        ownerId: admin._id,
        hidden: false,
      });
      const res = await agent.get("/food?limit=4").expect(200);
      assert.lengthOf(res.body.data, 3);
      assert.isTrue(res.body.more);
      assert.equal(res.body.data[0].id, (spinach as any).id);
      assert.equal(res.body.data[1].id, (pizza as any).id);
      assert.equal(res.body.data[2].id, (carrots as any).id);
    });

    it("list page", async function () {
      // Should skip to carrots since apples are hidden
      const res = await agent.get("/food?limit=1&page=2").expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.isTrue(res.body.more);
      assert.equal(res.body.data[0].id, (pizza as any).id);
    });

    it("list page 0 ", async function () {
      const res = await agent.get("/food?limit=1&page=0").expect(400);
      assert.equal(res.body.message, "Invalid page: 0");
    });

    it("list page with garbage ", async function () {
      const res = await agent.get("/food?limit=1&page=abc").expect(400);
      assert.equal(res.body.message, "Invalid page: abc");
    });

    it("list page over", async function () {
      // Should skip to carrots since apples are hidden
      const res = await agent.get("/food?limit=1&page=5").expect(200);
      assert.lengthOf(res.body.data, 0);
      assert.isFalse(res.body.more);
    });

    it("list query params", async function () {
      // Should skip to carrots since apples are hidden
      const res = await agent.get("/food?hidden=true").expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.isFalse(res.body.more);
      assert.equal(res.body.data[0].id, (apple as any).id);
    });

    it("list query params not in list", async function () {
      // Should skip to carrots since apples are hidden
      const res = await agent.get("/food?name=Apple").expect(400);
      assert.equal(res.body.message, "name is not allowed as a query param.");
    });

    it("list query by nested param", async function () {
      // Should skip to carrots since apples are hidden
      const res = await agent.get("/food?source.name=USDA").expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.equal(res.body.data[0].id, (carrots as any).id);
    });

    it("query by date", async function () {
      const authRes = await server
        .post("/auth/login")
        .send({email: "admin@example.com", password: "securePassword"})
        .expect(200);
      const token = authRes.body.data.token;

      // Inclusive
      let res = await server
        .get(
          `/food?limit=3&${qs.stringify({
            created: {
              $lte: "2021-12-03T00:00:20.000Z",
              $gte: "2021-12-03T00:00:00.000Z",
            },
          })}`
        )
        .set("authorization", `Bearer ${token}`)
        .expect(200);
      assert.sameDeepMembers(
        ["2021-12-03T00:00:20.000Z", "2021-12-03T00:00:10.000Z", "2021-12-03T00:00:00.000Z"],
        res.body.data.map((d: any) => d.created)
      );

      // Inclusive one side
      res = await server
        .get(
          `/food?limit=3&${qs.stringify({
            created: {
              $lt: "2021-12-03T00:00:20.000Z",
              $gte: "2021-12-03T00:00:00.000Z",
            },
          })}`
        )
        .set("authorization", `Bearer ${token}`)
        .expect(200);
      assert.sameDeepMembers(
        ["2021-12-03T00:00:10.000Z", "2021-12-03T00:00:00.000Z"],
        res.body.data.map((d: any) => d.created)
      );

      // Inclusive both sides
      res = await server
        .get(
          `/food?limit=3&${qs.stringify({
            created: {
              $lt: "2021-12-03T00:00:20.000Z",
              $gt: "2021-12-03T00:00:00.000Z",
            },
          })}`
        )
        .set("authorization", `Bearer ${token}`)
        .expect(200);
      assert.sameDeepMembers(
        ["2021-12-03T00:00:10.000Z"],
        res.body.data.map((d: any) => d.created)
      );
    });
  });

  describe("discriminator", function () {
    let superUser: mongoose.Document<SuperUser>;
    let staffUser: mongoose.Document<StaffUser>;
    let notAdmin: mongoose.Document;
    let agent: supertest.SuperAgentTest;

    beforeEach(async function () {
      [notAdmin] = await setupDb();
      [staffUser, superUser] = await Promise.all([
        StaffUserModel.create({email: "staff@example.com", department: "Accounting"}),
        SuperUserModel.create({email: "superuser@example.com", superTitle: "Super Man"}),
      ]);

      app = getBaseServer();
      setupAuth(app, UserModel as any);
      app.use(
        "/users",
        gooseRestRouter(UserModel, {
          permissions: {
            list: [Permissions.IsAuthenticated],
            create: [Permissions.IsAuthenticated],
            read: [Permissions.IsAuthenticated],
            update: [Permissions.IsAuthenticated],
            delete: [Permissions.IsAuthenticated],
          },
          discriminatorKey: "__t",
        })
      );

      server = supertest(app);

      agent = await authAsUser(app, "notAdmin");
    });

    it("gets all users", async function () {
      const res = await agent.get("/users").expect(200);
      assert.lengthOf(res.body.data, 4);

      const data = sortBy(res.body.data, ["email"]);

      assert.equal(data[0].email, "admin@example.com");
      assert.isUndefined(data[0].department);
      assert.isUndefined(data[0].supertitle);
      assert.isUndefined(data[0].__t);

      assert.equal(data[1].email, "notAdmin@example.com");
      assert.isUndefined(data[1].department);
      assert.isUndefined(data[1].supertitle);
      assert.isUndefined(data[1].__t);

      assert.equal(data[2].email, "staff@example.com");
      assert.equal(data[2].department, "Accounting");
      assert.isUndefined(data[2].supertitle);
      assert.equal(data[2].__t, "Staff");

      assert.equal(data[3].email, "superuser@example.com");
      assert.isUndefined(data[3].department);
      assert.equal(data[3].superTitle, "Super Man");
      assert.equal(data[3].__t, "SuperUser");
    });

    it("gets a discriminated user", async function () {
      const res = await agent.get(`/users/${superUser._id}`).expect(200);

      assert.equal(res.body.data.email, "superuser@example.com");
      assert.isUndefined(res.body.data.department);
      assert.equal(res.body.data.superTitle, "Super Man");
    });

    it("updates a discriminated user", async function () {
      // Fails without __t.
      await agent.patch(`/users/${superUser._id}`).send({superTitle: "Batman"}).expect(404);

      const res = await agent
        .patch(`/users/${superUser._id}`)
        .send({superTitle: "Batman", __t: "SuperUser"})
        .expect(200);

      assert.equal(res.body.data.email, "superuser@example.com");
      assert.isUndefined(res.body.data.department);
      assert.equal(res.body.data.superTitle, "Batman");

      const user = await SuperUserModel.findById(superUser._id);
      assert.equal(user?.superTitle, "Batman");
    });

    it("updates a base user", async function () {
      const res = await agent
        .patch(`/users/${notAdmin._id}`)
        .send({email: "newemail@example.com", superTitle: "The Boss"})
        .expect(200);

      assert.equal(res.body.data.email, "newemail@example.com");
      assert.isUndefined(res.body.data.superTitle);

      const user = await SuperUserModel.findById(notAdmin._id);
      assert.isUndefined(user?.superTitle);
    });

    it("cannot update discriminator key", async function () {
      await agent
        .patch(`/users/${notAdmin._id}`)
        .send({superTitle: "Batman", __t: "Staff"})
        .expect(404);

      await agent
        .patch(`/users/${staffUser._id}`)
        .send({superTitle: "Batman", __t: "SuperUser"})
        .expect(404);
    });

    it("updating a field on another discriminated model does nothing", async function () {
      const res = await agent
        .patch(`/users/${superUser._id}`)
        .send({department: "Journalism", __t: "SuperUser"})
        .expect(200);

      assert.isUndefined(res.body.data.department);

      const user = await SuperUserModel.findById(superUser._id);
      assert.isUndefined(user?.department);
    });

    it("creates a discriminated user", async function () {
      const res = await agent
        .post("/users")
        .send({
          email: "brucewayne@example.com",
          superTitle: "Batman",
          department: "R&D",
          __t: "SuperUser",
        })
        .expect(201);

      assert.equal(res.body.data.email, "brucewayne@example.com");
      // Because we pass __t, this should create a SuperUser which has no department, so this is dropped.
      assert.isUndefined(res.body.data.department);
      assert.equal(res.body.data.superTitle, "Batman");

      const user = await SuperUserModel.findById(res.body.data._id);
      assert.equal(user?.superTitle, "Batman");
    });

    it("deletes a discriminated user", async function () {
      // Fails without __t.
      await agent.delete(`/users/${superUser._id}`).expect(404);

      await agent
        .delete(`/users/${superUser._id}`)
        .send({
          __t: "SuperUser",
        })
        .expect(204);

      const user = await SuperUserModel.findById(superUser._id);
      assert.isNull(user);
    });

    it("deletes a base user", async function () {
      // Fails for base user with __t
      await agent.delete(`/users/${notAdmin._id}`).send({__t: "SuperUser"}).expect(404);

      await agent.delete(`/users/${notAdmin._id}`).expect(204);

      const user = await SuperUserModel.findById(notAdmin._id);
      assert.isNull(user);
    });
  });
});
