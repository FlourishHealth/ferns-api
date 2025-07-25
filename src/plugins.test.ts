import chai, {assert} from "chai";
import chaiAsPromised from "chai-as-promised";
import express from "express";
import {model, Schema} from "mongoose";

import {Permissions} from "./permissions";

chai.use(chaiAsPromised);

import supertest from "supertest";
import TestAgent from "supertest/lib/agent";

import {fernsRouter} from "./api";
import {addAuthRoutes, setupAuth} from "./auth";
import {
  createdUpdatedPlugin,
  DateOnly,
  findAtMostOne,
  findExactlyOne,
  isDeletedPlugin,
} from "./plugins";
import {authAsUser, getBaseServer, setupDb, UserModel} from "./tests";

interface Stuff {
  _id: string;
  name: string;
  ownerId: string;
  date: Date;
  created: Date;
  updated?: Date;
}

const stuffSchema = new Schema<Stuff>({
  name: String,
  ownerId: String,
  date: DateOnly,
});

stuffSchema.plugin(isDeletedPlugin);
stuffSchema.plugin(findAtMostOne);
stuffSchema.plugin(findExactlyOne);
stuffSchema.plugin(createdUpdatedPlugin);

const StuffModel = model<Stuff>("Stuff", stuffSchema);

describe("createdUpdate", function () {
  it("sets created and updated on save", async function () {
    jest.useFakeTimers({
      now: new Date("2022-12-17T03:24:00.000Z"),
      advanceTimers: true,
    });

    const stuff = await StuffModel.create({name: "Things", ownerId: "123"});
    assert.isNotNull(stuff.created);
    assert.isNotNull(stuff.updated);
    assert.equal(stuff.created.toISOString(), "2022-12-17T03:24:00.000Z");
    assert.equal(stuff.updated?.toISOString(), "2022-12-17T03:24:00.000Z");

    stuff.name = "Thangs";
    jest.advanceTimersByTime(10000);
    await stuff.save();
    assert.equal(stuff.created.toISOString(), "2022-12-17T03:24:00.000Z");
    assert.isTrue(stuff.updated! > stuff.created);
    jest.useRealTimers();
  });
});

describe("isDeleted", function () {
  beforeEach(async function () {
    await StuffModel.deleteMany({});
    await Promise.all([
      StuffModel.create({
        name: "Things",
        ownerId: "123",
        deleted: true,
      }),
      StuffModel.create({
        name: "StuffNThings",
        ownerId: "123",
      }),
    ]);
  });

  it('filters out deleted documents from "find"', async function () {
    let stuff = await StuffModel.find({});
    assert.lengthOf(stuff, 1);
    assert.equal(stuff[0].name, "StuffNThings");
    // Providing deleted in query should return deleted documents:
    stuff = await StuffModel.find({deleted: true});
    assert.lengthOf(stuff, 1);
    assert.equal(stuff[0].name, "Things");
  });

  it('filters out deleted documents from "findOne"', async function () {
    let stuff = await StuffModel.findOne({});
    assert.equal(stuff?.name, "StuffNThings");
    // Providing deleted in query should return deleted document:
    stuff = await StuffModel.findOne({deleted: true});
    assert.equal(stuff?.name, "Things");
  });
});

describe("findAtMostOne", function () {
  let things: any;

  beforeEach(async function () {
    await StuffModel.deleteMany({});
    await setupDb();

    [things] = await Promise.all([
      StuffModel.create({
        name: "Things",
        ownerId: "123",
      }),
      StuffModel.create({
        name: "StuffNThings",
        ownerId: "123",
      }),
    ]);
  });

  it("returns null with no matches.", async function () {
    const result = await (StuffModel as any).findAtMostOne({name: "OtherStuff"});
    assert.isNull(result);
  });

  it("returns a single match", async function () {
    const result = await (StuffModel as any).findAtMostOne({name: "Things"});
    assert.equal(result._id.toString(), things._id.toString());
  });

  it("throws error with two matches.", async function () {
    const fn = () => (StuffModel as any).findAtMostOne({ownerId: "123"});
    await assert.isRejected(fn(), /Stuff\.findOne query returned multiple documents/);
  });

  it("throws custom error with two matches.", async function () {
    const fn = () =>
      (StuffModel as any).findAtMostOne({ownerId: "123"}, {status: 400, title: "Oh no!"});

    try {
      await fn();
      // If the promise doesn't reject, the test should fail
      assert.fail("Expected promise to reject");
    } catch (error: any) {
      // Check if the error has title and status properties
      assert.equal(error.title, "Oh no!");
      assert.equal(error.status, 400);
      assert.equal(error.detail, 'query: {"ownerId":"123"}');
    }
  });
});

describe("findExactlyOne", function () {
  let things: any;

  beforeEach(async function () {
    await StuffModel.deleteMany({});
    await setupDb();

    [things] = await Promise.all([
      StuffModel.create({
        name: "Things",
        ownerId: "123",
      }),
      StuffModel.create({
        name: "StuffNThings",
        ownerId: "123",
      }),
    ]);
  });

  it("throws error with no matches.", async function () {
    const fn = () => (StuffModel as any).findExactlyOne({name: "OtherStuff"});
    await assert.isRejected(fn(), /Stuff\.findExactlyOne query returned no documents/);
  });

  it("returns a single match", async function () {
    const result = await (StuffModel as any).findExactlyOne({name: "Things"});
    assert.equal(result._id.toString(), things._id.toString());
  });

  it("throws error with two matches.", async function () {
    const fn = () => (StuffModel as any).findExactlyOne({ownerId: "123"});
    await assert.isRejected(fn(), /Stuff\.findExactlyOne query returned multiple documents/);
  });

  it("throws custom error with two matches.", async function () {
    const fn = () =>
      (StuffModel as any).findExactlyOne({ownerId: "123"}, {status: 400, title: "Oh no!"});

    try {
      await fn();
      // If the promise doesn't reject, the test should fail
      assert.fail("Expected promise to reject");
    } catch (error: any) {
      // Check if the error has title and status properties
      assert.equal(error.title, "Oh no!");
      assert.equal(error.status, 400);
      assert.equal(error.detail, 'query: {"ownerId":"123"}');
    }
  });
});

describe("DateOnly", function () {
  it("throws error with invalid date", async function () {
    try {
      await StuffModel.create({name: "Things", ownerId: "123", date: "foo" as any});
    } catch (error: any) {
      assert.match(error.message, /Cast to DateOnly failed/);
      return;
    }
    assert.fail(`Expected error was not thrown`);
  });

  it("adjusts date to date only", async function () {
    const res = await StuffModel.create({
      name: "Things",
      ownerId: "123",
      date: "2005-10-10T17:17:17.017Z",
    });
    assert.strictEqual(res.date.toISOString(), "2005-10-10T00:00:00.000Z");
  });

  it("filter on date only", async function () {
    await StuffModel.create({
      name: "Things",
      ownerId: "123",
      date: "2000-10-10T17:17:17.017Z",
    });
    let found = await StuffModel.findOne({
      date: {$gte: "2000-01-01T00:00:00.000Z", $lt: "2001-01-01T00:00:00.000Z"},
    });
    assert.strictEqual(found!.date.toISOString(), "2000-10-10T00:00:00.000Z");
    found = await StuffModel.findOne({
      date: {$gte: "2000-01-01T12:12:12.000Z", $lt: "2001-01-01T12:12:12.000Z"},
    });
    assert.strictEqual(found!.date.toISOString(), "2000-10-10T00:00:00.000Z");
  });

  describe("handle 404", function () {
    let agent: TestAgent;
    let app: express.Application;

    beforeEach(async function () {
      await setupDb();
      app = getBaseServer();
      setupAuth(app, UserModel as any);
      addAuthRoutes(app, UserModel as any);
      app.use(
        "/stuff",
        fernsRouter(StuffModel, {
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
      supertest(app);
      agent = await authAsUser(app, "notAdmin");
    });

    it("returns 404 with context for hidden document", async () => {
      const doc = await StuffModel.create({name: "test", deleted: true});
      const res = await agent.get(`/stuff/${doc._id}`).expect(404);
      assert.equal(res.body.title, `Document ${doc._id} not found for model Stuff`);
      assert.deepEqual(res.body.meta, {deleted: "true"});
    });

    it("returns 404 without meta for missing document", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const res = await agent.get(`/stuff/${nonExistentId}`).expect(404);
      assert.equal(res.body.title, `Document ${nonExistentId} not found for model Stuff`);
      assert.isUndefined(res.body.meta);
    });
  });
});
