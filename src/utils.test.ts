import {assert} from "chai";

import {isValidObjectId} from "./utils";

describe("utils", function () {
  it("checks valid ObjectIds", function () {
    assert.isTrue(isValidObjectId("62c44da0003d9f8ee8cc925c"));
    assert.isTrue(isValidObjectId("620000000000000000000000"));
    // Mongoose's builtin "ObjectId.isValid" will falsely say this is an ObjectId.
    assert.isFalse(isValidObjectId("1234567890ab"));
    assert.isFalse(isValidObjectId("microsoft123"));
    assert.isFalse(isValidObjectId("62c44da0003d9f8ee8cc925x"));
  });
});
