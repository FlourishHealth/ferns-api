import chai, {assert} from "chai";
import chaiAsPromised from "chai-as-promised";
import {model, Schema} from "mongoose";
chai.use(chaiAsPromised);

import {findExactlyOne, findOneOrThrow} from "./plugins";
import {setupDb} from "./tests";

interface Stuff {
  _id: string;
  name: string;
  ownerId: string;
}

const stuffSchema = new Schema<Stuff>({
  name: String,
  ownerId: String,
});

stuffSchema.plugin(findOneOrThrow);
stuffSchema.plugin(findExactlyOne);

const stuffModel = model<Stuff>("Stuff", stuffSchema);

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
