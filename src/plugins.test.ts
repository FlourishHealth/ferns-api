import chai, {assert} from "chai";
import chaiAsPromised from "chai-as-promised";
import {model, Schema} from "mongoose";
chai.use(chaiAsPromised);

import {findOneOrThrow} from "./plugins";
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
    await assert.isRejected(fn(), "findOne query returned multiple documents");
  });
});
