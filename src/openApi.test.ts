import {assert} from "chai";
import express, {Router} from "express";
import supertest from "supertest";
import TestAgent from "supertest/lib/agent";

import {fernsRouter, FernsRouterOptions} from "./api";
import {addAuthRoutes, setupAuth} from "./auth";
import {setupServer} from "./expressServer";
import {Permissions} from "./permissions";
import {FoodModel, setupDb, UserModel} from "./tests";

function getMessageSummaryOpenApiMiddleware(options: Partial<FernsRouterOptions<any>>): any {
  return options.openApi.path({
    tags: ["Food"],
    parameters: [
      {
        name: "foodIds",
        in: "query",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      200: {
        description: "Success",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  });
}

function addRoutes(router: Router, options?: Partial<FernsRouterOptions<any>>): void {
  router.use(
    "/food",
    fernsRouter(FoodModel as any, {
      ...options,
      allowAnonymous: true,
      populatePaths: [{path: "ownerId"}, {path: "eatenBy"}],
      permissions: {
        list: [Permissions.IsAny],
        create: [Permissions.IsAny],
        read: [Permissions.IsAny],
        update: [Permissions.IsAny],
        delete: [Permissions.IsAny],
      },
      queryFields: ["calories"],
      openApiExtraModelProperties: {
        foo: {
          type: "string",
        },
      },
    })
  );
  router.use("/food/count", getMessageSummaryOpenApiMiddleware, async (req, res) => {
    res.json({message: "count"});
  });
}

describe("openApi", function () {
  let server: TestAgent;
  let app: express.Application;

  beforeEach(async function () {
    process.env.REFRESH_TOKEN_SECRET = "testsecret1234";
    process.env.ENABLE_SWAGGER = "true";

    app = setupServer({addRoutes, userModel: UserModel as any, skipListen: true});
    setupAuth(app, UserModel as any);
    addAuthRoutes(app, UserModel as any);
  });

  it("gets the openapi.json", async function () {
    server = supertest(app);
    const res = await server.get("/openapi.json").expect(200);
    expect(res.body).toMatchSnapshot();
  });

  it("gets the swagger ui", async function () {
    server = supertest(app);
    await server.get("/swagger/").expect(200);
  });

  it("gets food with populated paths", async function () {
    server = supertest(app);
    // eslint-disable-next-line unused-imports/no-unused-vars
    const [admin, notAdmin] = await setupDb();
    const food = await FoodModel.create({name: "test", ownerId: notAdmin._id});
    const res = await server.get(`/food/${food._id}`).expect(200);
    expect(res.body.data.ownerId._id).toEqual(notAdmin._id.toString());
  });

  // create a test for a custom express endpoint that doesnt use fernsRouter and manually adds it
  // to openapi
  it("gets the openapi.json with custom endpoint", async function () {
    server = supertest(app);
    const res = await server.get("/openapi.json").expect(200);
    expect(res.body).toMatchSnapshot();
  });

  it("gets the openapi.json and has correct Number query fields", async function () {
    server = supertest(app);
    const res = await server.get("/openapi.json").expect(200);
    const foodQuery = res.body.paths["/food/"].get.parameters.find((p) => p.name === "calories");

    // Ensure that a Number query field supports gt/gte/lt/lte and just a Number
    assert.deepEqual(foodQuery.schema, {
      oneOf: [
        {type: "number"},
        {
          type: "object",
          properties: {
            $gt: {type: "number"},
            $gte: {type: "number"},
            $lt: {type: "number"},
            $lte: {type: "number"},
          },
        },
      ],
    });
    expect(foodQuery).toMatchSnapshot();
  });
});

function addRoutesPopulate(router: Router, options?: Partial<FernsRouterOptions<any>>): void {
  options?.openApi.component("schemas", "LimitedUser", {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "LimitedUser's name",
      },
      email: {
        type: "string",
        description: "LimitedUser's email",
      },
    },
  });

  router.use(
    "/food",
    fernsRouter(FoodModel as any, {
      ...options,
      allowAnonymous: true,
      populatePaths: [
        {path: "ownerId", fields: ["name", "email"]},
        {
          path: "eatenBy",
          fields: ["name", "email"],
          openApiComponent: "LimitedUser",
        },
        {
          path: "likesIds.userId",
          fields: ["name", "email"],
          openApiComponent: "LimitedUser",
        },
      ],
      permissions: {
        list: [Permissions.IsAny],
        create: [Permissions.IsAny],
        read: [Permissions.IsAny],
        update: [Permissions.IsAny],
        delete: [Permissions.IsAny],
      },
      openApiExtraModelProperties: {
        foo: {
          type: "string",
        },
      },
    })
  );
}

describe("openApi without swagger", function () {
  let server: TestAgent;
  let app: express.Application;

  beforeEach(async function () {
    process.env.REFRESH_TOKEN_SECRET = "testsecret1234";
    process.env.ENABLE_SWAGGER = "false";

    app = setupServer({addRoutes, userModel: UserModel as any, skipListen: true});
    setupAuth(app, UserModel as any);
    addAuthRoutes(app, UserModel as any);
  });

  it("does not have the swagger ui", async function () {
    server = supertest(app);
    await server.get("/swagger/").expect(404);
  });
});

describe("openApi populate", function () {
  let server: TestAgent;
  let app: express.Application;

  beforeEach(async function () {
    process.env.REFRESH_TOKEN_SECRET = "testsecret1234";

    app = setupServer({
      addRoutes: addRoutesPopulate,
      userModel: UserModel as any,
      skipListen: true,
    });
    setupAuth(app, UserModel as any);
    addAuthRoutes(app, UserModel as any);
  });

  it("gets the openapi.json with populate", async function () {
    server = supertest(app);
    const res = await server.get("/openapi.json").expect(200);
    const properties =
      res.body.paths["/food/{id}"].get.responses["200"].content["application/json"].schema
        .properties;

    // There's no component here, so we automatically generate the limited properties.
    assert.deepEqual(properties.ownerId, {
      properties: {
        name: {
          type: "string",
        },
        email: {
          type: "string",
        },
      },
      type: "object",
    });

    // We only reference the component here, rather than listing each field each time.
    assert.deepEqual(properties.eatenBy, {
      items: {
        $ref: "#/components/schemas/LimitedUser",
      },
      type: "array",
    });

    assert.deepEqual(properties.likesIds, {
      items: {
        properties: {
          _id: {
            type: "string",
          },
          likes: {
            type: "boolean",
          },
          userId: {
            $ref: "#/components/schemas/LimitedUser",
          },
        },
        required: [],
        type: "object",
      },
      type: "array",
    });

    // Ensure the component is registered and used.
    assert.deepEqual(res.body.components.schemas.LimitedUser, {
      properties: {
        email: {
          description: "LimitedUser's email",
          type: "string",
        },
        name: {
          description: "LimitedUser's name",
          type: "string",
        },
      },
      type: "object",
    });

    expect(res.body).toMatchSnapshot();
  });
});
