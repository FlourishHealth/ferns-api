import chai, {assert} from "chai";
import chaiAsPromised from "chai-as-promised";
import {model, Schema} from "mongoose";
import sinon from "sinon";
chai.use(chaiAsPromised);

import {
  createdUpdatedPlugin,
  DateOnly,
  findExactlyOne,
  findOneOrThrow,
  isDeletedPlugin,
} from "./plugins";
import {setupDb} from "./tests";

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
stuffSchema.plugin(findOneOrThrow);
stuffSchema.plugin(findExactlyOne);
stuffSchema.plugin(createdUpdatedPlugin);

const stuffModel = model<Stuff>("Stuff", stuffSchema);

describe("createdUpdate", function () {
  it("sets created and updated on save", async function () {
    const clock = sinon.useFakeTimers();
    clock.setSystemTime(new Date("2022-12-17T03:24:00.000Z"));

    const stuff = await stuffModel.create({name: "Things", ownerId: "123"});
    assert.isNotNull(stuff.created);
    assert.isNotNull(stuff.updated);
    assert.equal(stuff.created.toISOString(), "2022-12-17T03:24:00.000Z");
    assert.equal(stuff.updated?.toISOString(), "2022-12-17T03:24:00.000Z");

    stuff.name = "Thangs";
    await clock.tickAsync(10000);
    await stuff.save();
    assert.equal(stuff.created.toISOString(), "2022-12-17T03:24:00.000Z");
    assert.equal(stuff.updated?.toISOString(), "2022-12-17T03:24:10.000Z");

    clock.restore();
  });
});

describe("isDeleted", function () {
  beforeEach(async function () {
    await stuffModel.deleteMany({});
    await Promise.all([
      stuffModel.create({
        name: "Things",
        ownerId: "123",
        deleted: true,
      }),
      stuffModel.create({
        name: "StuffNThings",
        ownerId: "123",
      }),
    ]);
  });

  it('filters out deleted documents from "find"', async function () {
    let stuff = await stuffModel.find({});
    assert.lengthOf(stuff, 1);
    assert.equal(stuff[0].name, "StuffNThings");
    // Providing deleted in query should return deleted documents:
    stuff = await stuffModel.find({deleted: true});
    assert.lengthOf(stuff, 1);
    assert.equal(stuff[0].name, "Things");
  });

  it('filters out deleted documents from "findOne"', async function () {
    let stuff = await stuffModel.findOne({});
    assert.equal(stuff?.name, "StuffNThings");
    // Providing deleted in query should return deleted document:
    stuff = await stuffModel.findOne({deleted: true});
    assert.equal(stuff?.name, "Things");
  });
});

describe("findOneOrThrow", function () {
  let things: any;

  beforeEach(async function () {
    await stuffModel.deleteMany({});
    await setupDb();

    [things] = await Promise.all([
      stuffModel.create({
        name: "Things",
        ownerId: "123",
      }),
      stuffModel.create({
        name: "StuffNThings",
        ownerId: "123",
      }),
    ]);
  });

  it("returns null with no matches.", async function () {
    const result = await (stuffModel as any).findOneOrThrow({name: "OtherStuff"});
    assert.isNull(result);
  });

  it("returns a single match", async function () {
    const result = await (stuffModel as any).findOneOrThrow({name: "Things"});
    assert.equal(result._id.toString(), things._id.toString());
  });

  it("throws error with two matches.", async function () {
    const fn = () => (stuffModel as any).findOneOrThrow({ownerId: "123"});
    await assert.isRejected(fn(), /Stuff\.findOne query returned multiple documents/);
  });

  it("throws custom error with two matches.", async function () {
    const fn = () =>
      (stuffModel as any).findOneOrThrow({ownerId: "123"}, {status: 400, title: "Oh no!"});

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
    await stuffModel.deleteMany({});
    await setupDb();

    [things] = await Promise.all([
      stuffModel.create({
        name: "Things",
        ownerId: "123",
      }),
      stuffModel.create({
        name: "StuffNThings",
        ownerId: "123",
      }),
    ]);
  });

  it("throws error with no matches.", async function () {
    const fn = () => (stuffModel as any).findExactlyOne({name: "OtherStuff"});
    await assert.isRejected(fn(), /Stuff\.findExactlyOne query returned no documents/);
  });

  it("returns a single match", async function () {
    const result = await (stuffModel as any).findExactlyOne({name: "Things"});
    assert.equal(result._id.toString(), things._id.toString());
  });

  it("throws error with two matches.", async function () {
    const fn = () => (stuffModel as any).findExactlyOne({ownerId: "123"});
    await assert.isRejected(fn(), /Stuff\.findExactlyOne query returned multiple documents/);
  });

  it("throws custom error with two matches.", async function () {
    const fn = () =>
      (stuffModel as any).findExactlyOne({ownerId: "123"}, {status: 400, title: "Oh no!"});

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
      await stuffModel.create({name: "Things", ownerId: "123", date: "foo" as any});
    } catch (error: any) {
      assert.match(error.message, /Cast to DateOnly failed/);
      return;
    }
    assert.fail(`Expected error was not thrown`);
  });

  it("adjusts date to date only", async function () {
    const res = await stuffModel.create({
      name: "Things",
      ownerId: "123",
      date: "2005-10-10T17:17:17.017Z",
    });
    assert.strictEqual(res.date.toISOString(), "2005-10-10T00:00:00.000Z");
  });

  it("filter on date only", async function () {
    await stuffModel.create({
      name: "Things",
      ownerId: "123",
      date: "2000-10-10T17:17:17.017Z",
    });
    let found = await stuffModel.findOne({
      date: {$gte: "2000-01-01T00:00:00.000Z", $lt: "2001-01-01T00:00:00.000Z"},
    });
    assert.strictEqual(found!.date.toISOString(), "2000-10-10T00:00:00.000Z");
    found = await stuffModel.findOne({
      date: {$gte: "2000-01-01T12:12:12.000Z", $lt: "2001-01-01T12:12:12.000Z"},
    });
    assert.strictEqual(found!.date.toISOString(), "2000-10-10T00:00:00.000Z");
  });
});
