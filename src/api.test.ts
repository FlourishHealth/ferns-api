import * as Sentry from "@sentry/node";
import chai from "chai";
import express from "express";
import sortBy from "lodash/sortBy";
import mongoose from "mongoose";
import qs from "qs";
import supertest from "supertest";
import TestAgent from "supertest/lib/agent";

import {fernsRouter} from "./api";
import {addAuthRoutes, setupAuth} from "./auth";
import {logRequests} from "./expressServer";
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

const assert: Chai.AssertStatic = chai.assert;

jest.mock("@sentry/node", () => {
  // Auto-mock the Sentry module
  const originalModule = jest.requireActual("@sentry/node");

  return {
    ...originalModule, // Use the original module's implementations
    captureMessage: jest.fn(),
    captureException: jest.fn(),
    isInitialized: jest.fn(() => true), // Override isInitialized
  };
});

describe("ferns-api", () => {
  let server: TestAgent;
  let app: express.Application;

  describe("pre and post hooks", function () {
    let agent: TestAgent;

    beforeEach(async function () {
      await setupDb();
      app = getBaseServer();
      setupAuth(app, UserModel as any);
      addAuthRoutes(app, UserModel as any);
      agent = await authAsUser(app, "notAdmin");
    });

    it("pre hooks change data", async function () {
      let deleteCalled = false;
      app.use(
        "/food",
        fernsRouter(FoodModel, {
          allowAnonymous: true,
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
        fernsRouter(FoodModel, {
          allowAnonymous: true,
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
      await server.delete(`/food/${spinach._id}`).expect(403);
    });

    it("post hooks succeed", async function () {
      let deleteCalled = false;
      app.use(
        "/food",
        fernsRouter(FoodModel as any, {
          allowAnonymous: true,
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
    let agent: TestAgent;

    beforeEach(async function () {
      process.env.REFRESH_TOKEN_SECRET = "testsecret1234";

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
      addAuthRoutes(app, UserModel as any);
      app.use(
        "/food",
        fernsRouter(FoodModel, {
          allowAnonymous: true,
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

    it("updates timestamps on array subdocuments", async function () {
      // Create a food with categories that have timestamps
      const foodWithTimestamps = await FoodModel.create({
        name: "Food with Timestamps",
        calories: 100,
        created: new Date(),
        ownerId: admin._id,
        categories: [
          {
            name: "Category 1",
            show: true,
            updated: new Date("2024-01-01T00:00:00.000Z"),
          },
          {
            name: "Category 2",
            show: true,
            updated: new Date("2024-01-01T00:00:00.000Z"),
          },
        ],
      });

      const firstCategoryId = foodWithTimestamps.categories?.[0]?._id?.toString();
      const secondCategoryId = foodWithTimestamps.categories?.[1]?._id?.toString();

      if (!firstCategoryId || !secondCategoryId) {
        throw new Error("Failed to create food with categories");
      }

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update one of the categories
      const res = await agent
        .patch(`/food/${foodWithTimestamps._id}/categories/${firstCategoryId}`)
        .send({categories: {name: "Updated Category"}})
        .expect(200);

      // Verify the updated category has a newer timestamp
      const updatedCategory = res.body.data.categories.find((c: any) => c._id === firstCategoryId);
      const unchangedCategory = res.body.data.categories.find(
        (c: any) => c._id === secondCategoryId
      );

      if (!updatedCategory || !unchangedCategory) {
        throw new Error("Failed to find categories in response");
      }

      assert.notEqual(updatedCategory.updated, updatedCategory.created);
      assert.equal(unchangedCategory.updated, unchangedCategory.created);
      assert.equal(updatedCategory.name, "Updated Category");
      // Unchanged.
      assert.isTrue(updatedCategory.show);
      assert.isTrue(unchangedCategory.show);
    });

    it("array operations call postUpdate with different copy of document", async function () {
      let postUpdateDoc: any;
      let postUpdatePrevDoc: any;
      let postUpdateCalled = false;

      app = getBaseServer();
      setupAuth(app, UserModel as any);
      addAuthRoutes(app, UserModel as any);
      app.use(
        "/food",
        fernsRouter(FoodModel, {
          allowAnonymous: true,
          permissions: {
            list: [Permissions.IsAdmin],
            create: [Permissions.IsAdmin],
            read: [Permissions.IsAdmin],
            update: [Permissions.IsAdmin],
            delete: [Permissions.IsAdmin],
          },
          postUpdate: async (doc: any, cleanedBody: any, request: any, prevValue: any) => {
            postUpdateDoc = doc;
            postUpdatePrevDoc = prevValue;
            postUpdateCalled = true;
          },
        })
      );
      server = supertest(app);
      agent = await authAsUser(app, "admin");

      // Test POST operation (add to array)
      await agent
        .post(`/food/${apple._id}/categories`)
        .send({categories: {name: "New Category", show: true}})
        .expect(200);

      assert.isTrue(postUpdateCalled, "postUpdate should be called for array POST");
      assert.isDefined(postUpdateDoc, "postUpdate should receive updated document");
      assert.isDefined(postUpdatePrevDoc, "postUpdate should receive previous document");

      // Verify they are different object references
      assert.notStrictEqual(
        postUpdateDoc,
        postUpdatePrevDoc,
        "Document and prevValue should be different object references"
      );

      // Verify the content is different (new category added)
      assert.lengthOf(postUpdateDoc.categories, 3, "Updated document should have 3 categories");
      assert.lengthOf(
        postUpdatePrevDoc.categories,
        2,
        "Previous document should have 2 categories"
      );

      // Reset for next test
      postUpdateCalled = false;
      postUpdateDoc = undefined;
      postUpdatePrevDoc = undefined;

      // Test PATCH operation (update array item)
      const categoryId = apple.categories[0]._id;
      if (!categoryId) {
        throw new Error("Category ID is undefined");
      }
      await agent
        .patch(`/food/${apple._id}/categories/${categoryId}`)
        .send({categories: {name: "Updated Category", show: false}})
        .expect(200);

      assert.isTrue(postUpdateCalled, "postUpdate should be called for array PATCH");
      assert.isDefined(postUpdateDoc, "postUpdate should receive updated document");
      assert.isDefined(postUpdatePrevDoc, "postUpdate should receive previous document");

      // Verify they are different object references
      assert.notStrictEqual(
        postUpdateDoc,
        postUpdatePrevDoc,
        "Document and prevValue should be different object references"
      );

      // Verify the content is different (category updated)
      const updatedCategory = postUpdateDoc.categories.find(
        (c: any) => c._id.toString() === categoryId.toString()
      );
      const prevCategory = postUpdatePrevDoc.categories.find(
        (c: any) => c._id.toString() === categoryId.toString()
      );

      assert.equal(
        updatedCategory.name,
        "Updated Category",
        "Updated document should have new category name"
      );
      assert.equal(
        prevCategory.name,
        "Fruit",
        "Previous document should have original category name"
      );

      // Reset for next test
      postUpdateCalled = false;
      postUpdateDoc = undefined;
      postUpdatePrevDoc = undefined;

      // Test DELETE operation (remove from array)
      await agent.delete(`/food/${apple._id}/categories/${categoryId}`).expect(200);

      assert.isTrue(postUpdateCalled, "postUpdate should be called for array DELETE");
      assert.isDefined(postUpdateDoc, "postUpdate should receive updated document");
      assert.isDefined(postUpdatePrevDoc, "postUpdate should receive previous document");

      // Verify they are different object references
      assert.notStrictEqual(
        postUpdateDoc,
        postUpdatePrevDoc,
        "Document and prevValue should be different object references"
      );

      // Verify the content is different (category removed)
      const remainingCategories = postUpdateDoc.categories.filter(
        (c: any) => c._id.toString() === categoryId.toString()
      );
      const prevCategories = postUpdatePrevDoc.categories.filter(
        (c: any) => c._id.toString() === categoryId.toString()
      );

      assert.lengthOf(
        remainingCategories,
        0,
        "Updated document should not have the deleted category"
      );
      assert.lengthOf(prevCategories, 1, "Previous document should still have the category");
    });

    it("array operations with string arrays call postUpdate with different copy", async function () {
      let postUpdateDoc: any;
      let postUpdatePrevDoc: any;
      let postUpdateCalled = false;

      app = getBaseServer();
      setupAuth(app, UserModel as any);
      addAuthRoutes(app, UserModel as any);
      app.use(
        "/food",
        fernsRouter(FoodModel, {
          allowAnonymous: true,
          permissions: {
            list: [Permissions.IsAdmin],
            create: [Permissions.IsAdmin],
            read: [Permissions.IsAdmin],
            update: [Permissions.IsAdmin],
            delete: [Permissions.IsAdmin],
          },
          postUpdate: async (doc: any, cleanedBody: any, request: any, prevValue: any) => {
            postUpdateDoc = doc;
            postUpdatePrevDoc = prevValue;
            postUpdateCalled = true;
          },
        })
      );
      server = supertest(app);
      agent = await authAsUser(app, "admin");

      // Test POST operation with string array (add tag)
      await agent.post(`/food/${apple._id}/tags`).send({tags: "organic"}).expect(200);

      assert.isTrue(postUpdateCalled, "postUpdate should be called for string array POST");
      assert.isDefined(postUpdateDoc, "postUpdate should receive updated document");
      assert.isDefined(postUpdatePrevDoc, "postUpdate should receive previous document");

      // Verify they are different object references
      assert.notStrictEqual(
        postUpdateDoc,
        postUpdatePrevDoc,
        "Document and prevValue should be different object references"
      );

      // Verify the content is different (new tag added)
      assert.lengthOf(postUpdateDoc.tags, 3, "Updated document should have 3 tags");
      assert.lengthOf(postUpdatePrevDoc.tags, 2, "Previous document should have 2 tags");
      assert.include(postUpdateDoc.tags, "organic", "Updated document should include new tag");
      assert.notInclude(
        postUpdatePrevDoc.tags,
        "organic",
        "Previous document should not include new tag"
      );

      // Reset for next test
      postUpdateCalled = false;
      postUpdateDoc = undefined;
      postUpdatePrevDoc = undefined;

      // Test PATCH operation with string array (update tag)
      await agent
        .patch(`/food/${apple._id}/tags/healthy`)
        .send({tags: "super-healthy"})
        .expect(200);

      assert.isTrue(postUpdateCalled, "postUpdate should be called for string array PATCH");
      assert.notStrictEqual(
        postUpdateDoc,
        postUpdatePrevDoc,
        "Document and prevValue should be different object references"
      );

      // Verify the content is different (tag updated)
      assert.include(
        postUpdateDoc.tags,
        "super-healthy",
        "Updated document should have updated tag"
      );
      assert.include(
        postUpdatePrevDoc.tags,
        "healthy",
        "Previous document should have original tag"
      );
      assert.notInclude(
        postUpdateDoc.tags,
        "healthy",
        "Updated document should not have original tag"
      );
      assert.notInclude(
        postUpdatePrevDoc.tags,
        "super-healthy",
        "Previous document should not have updated tag"
      );
    });
  });

  describe("standard methods", function () {
    let notAdmin: any;
    let admin: any;
    let adminOther: any;
    let agent: TestAgent;

    let spinach: Food;
    let apple: Food;
    let carrots: Food;
    let pizza: Food;

    beforeEach(async function () {
      [admin, notAdmin, adminOther] = await setupDb();

      [spinach, apple, carrots, pizza] = await Promise.all([
        FoodModel.create({
          name: "Spinach",
          calories: 1,
          created: new Date("2021-12-03T00:00:20.000Z"),
          ownerId: notAdmin._id,
          hidden: false,
          source: {
            name: "Brand",
            href: "https://www.google.com",
            dateAdded: "2023-12-13T12:30:00.000Z",
          },
          lastEatenWith: {
            dressing: "2021-12-03T19:00:30.000Z",
          },
          eatenBy: [admin._id],
        }),
        FoodModel.create({
          name: "Apple",
          calories: 100,
          created: new Date("2021-12-03T00:00:30.000Z"),
          ownerId: admin._id,
          hidden: true,
          tags: ["healthy"],
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
          tags: ["healthy", "cheap"],
          eatenBy: [admin._id, notAdmin._id],
        }),
        FoodModel.create({
          name: "Pizza",
          calories: 400,
          created: new Date("2021-12-03T00:00:10.000Z"),
          ownerId: admin._id,
          hidden: false,
          tags: ["cheap"],
          eatenBy: [adminOther._id],
        }),
      ]);
      app = getBaseServer();
      setupAuth(app, UserModel as any);
      addAuthRoutes(app, UserModel as any);
      app.use(logRequests);
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
          defaultLimit: 2,
          maxLimit: 3,
          sort: {created: "descending"},
          defaultQueryParams: {hidden: false},
          queryFields: ["hidden", "name", "calories", "created", "source.name", "tags", "eatenBy"],
          populatePaths: [{path: "ownerId"}],
        })
      );
      server = supertest(app);
      agent = await authAsUser(app, "notAdmin");
    });

    it("read default", async function () {
      const res = await agent.get(`/food/${spinach._id}`).expect(200);
      assert.equal(res.body.data._id, spinach._id.toString());
      // Ensure populate works
      assert.equal(res.body.data.ownerId._id, notAdmin.id);
      // Ensure maps are properly transformed
      assert.deepEqual(res.body.data.lastEatenWith, {dressing: "2021-12-03T19:00:30.000Z"});
    });

    it("list default", async function () {
      const res = await agent.get("/food").expect(200);
      assert.lengthOf(res.body.data, 2);
      assert.equal(res.body.data[0].id, (spinach as any).id);
      assert.equal(res.body.data[0].ownerId._id, notAdmin.id);
      assert.equal(res.body.data[1].id, (pizza as any).id);
      assert.equal(res.body.data[1].ownerId._id, admin.id);
      // Check that mongoose Map is handled correctly.
      assert.deepEqual(res.body.data[0].lastEatenWith, {dressing: "2021-12-03T19:00:30.000Z"});
      assert.deepEqual(res.body.data[1].lastEatenWith, undefined);

      assert.isTrue(res.body.more);
      assert.equal(res.body.total, 3);
    });

    it("list limit", async function () {
      const res = await agent.get("/food?limit=1").expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.equal(res.body.data[0].id, (spinach as any).id);
      assert.equal(res.body.data[0].ownerId._id, notAdmin.id);
      assert.isTrue(res.body.more);
      assert.equal(res.body.total, 3);
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
      assert.equal(res.body.total, 4);
      assert.equal(res.body.data[0].id, (spinach as any).id);
      assert.equal(res.body.data[1].id, (pizza as any).id);
      assert.equal(res.body.data[2].id, (carrots as any).id);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'More than 3 results returned for foods without pagination, data may be silently truncated. req.query: {"limit":"4"}'
      );
    });

    it("list page", async function () {
      // Should skip to carrots since apples are hidden
      const res = await agent.get("/food?limit=1&page=2").expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.isTrue(res.body.more);
      assert.equal(res.body.total, 3);
      assert.equal(res.body.data[0].id, (pizza as any).id);
    });

    it("list page 0 ", async function () {
      const res = await agent.get("/food?limit=1&page=0").expect(400);
      assert.equal(res.body.title, "Invalid page: 0");
    });

    it("list page with garbage ", async function () {
      const res = await agent.get("/food?limit=1&page=abc").expect(400);
      assert.equal(res.body.title, "Invalid page: abc");
    });

    it("list page over", async function () {
      // Should skip to carrots since apples are hidden
      const res = await agent.get("/food?limit=1&page=5").expect(200);
      assert.lengthOf(res.body.data, 0);
      assert.isFalse(res.body.more);
      assert.equal(res.body.total, 3);
    });

    it("list query params", async function () {
      // Should skip to carrots since apples are hidden
      const res = await agent.get("/food?hidden=true").expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.isFalse(res.body.more);
      assert.equal(res.body.total, 1);
      assert.equal(res.body.data[0].id, (apple as any).id);
    });

    it("list query params not in list", async function () {
      // Should skip to carrots since apples are hidden
      const res = await agent.get(`/food?ownerId=${admin._id}`).expect(400);
      assert.equal(res.body.title, "ownerId is not allowed as a query param.");
    });

    it("list query by nested param", async function () {
      // Should skip to carrots since apples are hidden
      const res = await agent.get("/food?source.name=USDA").expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.equal(res.body.total, 1);
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

    it("query with a space", async function () {
      const greenBeans = await FoodModel.create({
        name: "Green Beans",
        calories: 102,
        created: new Date().getTime() - 10,
        ownerId: admin?._id,
      });
      const res = await agent.get(`/food?${qs.stringify({name: "Green Beans"})}`).expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.equal(res.body.data[0].id, greenBeans!.id);
      assert.equal(res.body.data[0].name, "Green Beans");
    });

    it("query with a regex", async function () {
      const greenBeans = await FoodModel.create({
        name: "Green Beans",
        calories: 102,
        created: new Date().getTime() - 10,
        ownerId: admin?._id,
      });

      // Case sensitive does match correct casing
      let res = await agent.get(`/food?${qs.stringify({name: {$regex: "Green"}})}`).expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.equal(res.body.data[0].id, greenBeans!.id);
      assert.equal(res.body.data[0].name, "Green Beans");

      // Fails with different casing and sensitive
      res = await agent.get(`/food?${qs.stringify({name: {$regex: "green"}})}`).expect(200);
      assert.lengthOf(res.body.data, 0);

      // Case insensitive does match different casing
      res = await agent
        .get(`/food?${qs.stringify({name: {$regex: "green", $options: "i"}})}`)
        .expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.equal(res.body.data[0].id, greenBeans!.id);
    });

    it("query with an $in operator", async function () {
      // Query including a hidden food
      let res = await server
        .get(
          `/food?${qs.stringify({
            name: {
              $in: ["Apple", "Spinach"],
            },
          })}`
        )
        .expect(200);
      assert.sameDeepMembers(
        res.body.data.map((d: any) => d.name),
        ["Spinach"]
      );

      // Query without hidden food.
      res = await server
        .get(
          `/food?${qs.stringify({
            name: {
              $in: ["Carrots", "Spinach"],
            },
          })}`
        )
        .expect(200);
      assert.sameDeepMembers(
        res.body.data.map((d: any) => d.name),
        ["Spinach", "Carrots"]
      );
    });

    it("query with an $in for _ids in nested object", async function () {
      // Query including a hidden food
      const res = await server
        .get(
          `/food?${qs.stringify({
            eatenBy: {
              $in: [notAdmin._id.toString(), adminOther._id.toString()],
            },
          })}`
        )
        .expect(200);
      assert.isFalse(res.body.more);
      assert.equal(res.body.total, 2);
      assert.lengthOf(res.body.data, 2);
      assert.sameDeepMembers(
        res.body.data.map((d: any) => d.name),
        ["Carrots", "Pizza"]
      );
    });

    it("query $and operator on same field", async function () {
      const res = await agent
        .get(`/food?${qs.stringify({$and: [{tags: "healthy"}, {tags: "cheap"}]})}`)
        .expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.equal(res.body.data[0].id, carrots!._id);
    });

    it("query $and operator on same field, nested objects", async function () {
      const res = await agent
        .get(
          `/food?${qs.stringify({
            $and: [{eatenBy: admin.id}, {eatenBy: notAdmin.id}],
          })}`
        )
        .expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.equal(res.body.data[0].id, carrots!._id);
    });

    it("query $or operator on same field", async function () {
      const res = await agent
        .get(`/food?${qs.stringify({$or: [{name: "Carrots"}, {name: "Pizza"}]})}`)
        .expect(200);
      assert.lengthOf(res.body.data, 2);
      // Only carrots matches both
      assert.sameDeepMembers(
        res.body.data.map((d) => d.id),
        [carrots!._id.toString(), pizza!._id.toString()]
      );
    });

    it("query $and operator on same field, nested objects", async function () {
      const res = await agent
        .get(
          `/food?${qs.stringify({
            limit: 3,
            $or: [{eatenBy: admin.id}, {eatenBy: notAdmin.id}],
          })}`
        )
        .expect(200);
      assert.lengthOf(res.body.data, 2);
      assert.sameDeepMembers(
        res.body.data.map((d) => d.id),
        [carrots!._id.toString(), spinach!._id.toString()]
      );
    });

    it("query $and and $or are rejected if field is not in queryFields", async function () {
      let res = await agent
        .get(`/food?${qs.stringify({$and: [{ownerId: "healthy"}, {tags: "cheap"}]})}`)
        .expect(400);
      assert.equal(res.body.title, "ownerId is not allowed as a query param.");
      // Check in the other order
      res = await agent
        .get(`/food?${qs.stringify({$and: [{tags: "cheap"}, {ownerId: "healthy"}]})}`)
        .expect(400);
      assert.equal(res.body.title, "ownerId is not allowed as a query param.");

      res = await agent
        .get(`/food?${qs.stringify({$or: [{tags: "cheap"}, {ownerId: "healthy"}]})}`)
        .expect(400);
      assert.equal(res.body.title, "ownerId is not allowed as a query param.");
    });

    it("query with a number", async function () {
      const res = await agent.get(`/food?calories=100`).expect(200);
      assert.lengthOf(res.body.data, 1);
      assert.equal(res.body.data[0].id, carrots!._id);
    });

    it("update", async function () {
      let res = await agent.patch(`/food/${spinach._id}`).send({name: "Kale"}).expect(200);
      assert.equal(res.body.data.name, "Kale");
      assert.equal(res.body.data.calories, 1);
      assert.equal(res.body.data.hidden, false);

      // Update a Map field.
      res = await agent
        .patch(`/food/${spinach._id}`)
        .send({lastEatenWith: {dressing: "2023-12-03T00:00:20.000Z"}})
        .expect(200);
      assert.equal(res.body.data.name, "Kale");
      assert.equal(res.body.data.calories, 1);
      assert.equal(res.body.data.hidden, false);
      assert.deepEqual(res.body.data.lastEatenWith, {dressing: "2023-12-03T00:00:20.000Z"});

      // Update a Map field.
      res = await agent
        .patch(`/food/${spinach._id}`)
        .send({
          lastEatenWith: {
            dressing: "2023-12-03T00:00:20.000Z",
            cucumber: "2023-12-04T12:00:20.000Z",
          },
        })
        .expect(200);
      assert.deepEqual(res.body.data.lastEatenWith, {
        dressing: "2023-12-03T00:00:20.000Z",
        cucumber: "2023-12-04T12:00:20.000Z",
      });
    });

    it("update using dot notation", async function () {
      // Allows updating a single field in a nested object
      const res = await agent
        .patch(`/food/${spinach._id}`)
        .send({"source.href": "https://food.com"})
        .expect(200);
      // Assert the field was updated with dot notation.
      assert.equal(res.body.data.source.href, "https://food.com");
      // Assert these fields haven't changed.
      assert.equal(res.body.data.source.name, "Brand");
      assert.equal(res.body.data.source.dateAdded, "2023-12-13T12:30:00.000Z");

      const dbSpinach = await FoodModel.findById(spinach._id);
      assert.equal(dbSpinach?.source.href, "https://food.com");
      assert.equal(dbSpinach?.source.name, "Brand");
      assert.equal(dbSpinach?.source.dateAdded, "2023-12-13T12:30:00.000Z");
    });
  });

  describe("populate", function () {
    let admin: any;
    let notAdmin: any;
    let agent: TestAgent;

    let spinach: Food;

    beforeEach(async function () {
      [admin, notAdmin] = await setupDb();

      [spinach] = await Promise.all([
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
          name: "Carrots",
          calories: 1,
          created: new Date("2022-12-03T00:00:20.000Z"),
          ownerId: notAdmin._id,
          hidden: false,
          source: {
            name: "User",
          },
        }),
      ]);
      app = getBaseServer();
      setupAuth(app, UserModel as any);
      addAuthRoutes(app, UserModel as any);
      app.use(
        "/food",
        fernsRouter(FoodModel, {
          sort: "-created",
          allowAnonymous: true,
          permissions: {
            list: [Permissions.IsAny],
            create: [Permissions.IsAny],
            read: [Permissions.IsAny],
            update: [Permissions.IsAny],
            delete: [Permissions.IsAny],
          },
          populatePaths: [{path: "ownerId", fields: ["email"]}],
        })
      );
      server = supertest(app);
      agent = await authAsUser(app, "notAdmin");
    });

    it("lists with populate", async function () {
      const res = await agent.get(`/food`).expect(200);
      assert.lengthOf(res.body.data, 2);
      const [carrots, spin] = res.body.data;
      assert.equal(carrots.ownerId._id, notAdmin._id);
      assert.equal(carrots.ownerId.email, notAdmin.email);
      assert.isUndefined(carrots.ownerId.name);
      assert.equal(spin.ownerId._id, admin._id);
      assert.equal(spin.ownerId.email, admin.email);
      assert.isUndefined(spin.ownerId.name);
    });

    it("reads with populate", async function () {
      const res = await agent.get(`/food/${spinach._id}`).expect(200);
      assert.equal(res.body.data.ownerId._id, admin._id);
      assert.equal(res.body.data.ownerId.email, admin.email);
      assert.isUndefined(res.body.data.ownerId.name);
    });

    it("creates with populate", async function () {
      const res = await server
        .post("/food")
        .send({
          name: "Broccoli",
          calories: 15,
          ownerId: admin._id,
        })
        .expect(201);
      assert.equal(res.body.data.ownerId._id, admin._id);
      assert.equal(res.body.data.ownerId.email, admin.email);
      assert.isUndefined(res.body.data.ownerId.name);
    });

    it("updates with populate", async function () {
      const res = await server
        .patch(`/food/${spinach._id}`)
        .send({
          name: "NotSpinach",
        })
        .expect(200);
      assert.equal(res.body.data.ownerId._id, admin._id);
      assert.equal(res.body.data.ownerId.email, admin.email);
      assert.isUndefined(res.body.data.ownerId.name);
    });
  });

  describe("responseHandler", function () {
    let admin: any;
    let agent: TestAgent;

    let spinach: Food;

    beforeEach(async function () {
      [admin] = await setupDb();

      [spinach] = await Promise.all([
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
          created: new Date().getTime() - 10,
          ownerId: admin?._id,
          hidden: true,
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
            create: [Permissions.IsAny],
            read: [Permissions.IsAny],
            update: [Permissions.IsAny],
            delete: [Permissions.IsAny],
          },
          responseHandler: (data, method) => {
            if (method === "list") {
              return (data as any).map((d: any) => ({
                id: (d as any)._id,
                foo: "bar",
              }));
            } else {
              return {
                id: (data as any)._id,
                foo: "bar",
              };
            }
          },
        })
      );
      server = supertest(app);
      agent = await authAsUser(app, "notAdmin");
    });

    it("reads with serialize", async function () {
      const res = await agent.get(`/food/${spinach._id}`).expect(200);
      assert.isUndefined(res.body.data.ownerId);
      assert.equal(res.body.data.id, spinach._id.toString());
      assert.equal(res.body.data.foo, "bar");
    });

    it("list with serialize", async function () {
      const res = await agent.get(`/food`).expect(200);
      assert.isUndefined(res.body.data[0].ownerId);
      assert.isUndefined(res.body.data[1].ownerId);

      assert.isDefined(res.body.data[0].id);
      assert.equal(res.body.data[0].foo, "bar");
      assert.isDefined(res.body.data[1].id);
      assert.equal(res.body.data[1].foo, "bar");
    });
  });

  describe("plugins", function () {
    let agent: TestAgent;

    beforeEach(async function () {
      await setupDb();
      app = getBaseServer();
      setupAuth(app, UserModel as any);
      addAuthRoutes(app, UserModel as any);
      app.use(
        "/users",
        fernsRouter(UserModel, {
          allowAnonymous: true,
          permissions: {
            list: [Permissions.IsAny],
            create: [Permissions.IsAny],
            read: [Permissions.IsAny],
            update: [Permissions.IsAny],
            delete: [Permissions.IsAny],
          },
        })
      );
      server = supertest(app);
      agent = await authAsUser(app, "notAdmin");
    });

    it("check that security fields are filtered", async function () {
      const res = await agent.get("/users").expect(200);
      assert.isDefined(res.body.data[0].email);
      assert.isUndefined(res.body.data[0].token);
      assert.isUndefined(res.body.data[0].hash);
      assert.isUndefined(res.body.data[0].salt);
    });
  });

  describe("discriminator", function () {
    let superUser: mongoose.Document<SuperUser>;
    let staffUser: mongoose.Document<StaffUser>;
    let notAdmin: mongoose.Document;
    let agent: TestAgent;

    beforeEach(async function () {
      [notAdmin] = await setupDb();
      const [staffUserId, superUserId] = await Promise.all([
        StaffUserModel.create({email: "staff@example.com", department: "Accounting"}),
        SuperUserModel.create({email: "superuser@example.com", superTitle: "Super Man"}),
      ]);
      staffUser = (await UserModel.findById(staffUserId)) as any;
      superUser = (await UserModel.findById(superUserId)) as any;

      app = getBaseServer();
      setupAuth(app, UserModel as any);
      addAuthRoutes(app, UserModel as any);
      app.use(
        "/users",
        fernsRouter(UserModel, {
          allowAnonymous: true,
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
      assert.lengthOf(res.body.data, 5);

      const data = sortBy(res.body.data, ["email"]);

      assert.equal(data[0].email, "admin+other@example.com");
      assert.isUndefined(data[0].department);
      assert.isUndefined(data[0].supertitle);
      assert.isUndefined(data[0].__t);

      assert.equal(data[1].email, "admin@example.com");
      assert.isUndefined(data[1].department);
      assert.isUndefined(data[1].supertitle);
      assert.isUndefined(data[1].__t);

      assert.equal(data[2].email, "notAdmin@example.com");
      assert.isUndefined(data[2].department);
      assert.isUndefined(data[2].supertitle);
      assert.isUndefined(data[2].__t);

      assert.equal(data[3].email, "staff@example.com");
      assert.equal(data[3].department, "Accounting");
      assert.isUndefined(data[3].supertitle);
      assert.equal(data[3].__t, "Staff");

      assert.equal(data[4].email, "superuser@example.com");
      assert.isUndefined(data[4].department);
      assert.equal(data[4].superTitle, "Super Man");
      assert.equal(data[4].__t, "SuperUser");
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
      // Because we pass __t, this should create a SuperUser which has no department, so this is
      // dropped.
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
