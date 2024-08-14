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
      populatePaths: ["ownerId", "eatenBy"],
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
  router.use("/food/count", getMessageSummaryOpenApiMiddleware, async (req, res) => {
    res.json({message: "count"});
  });
}

describe("openApi", function () {
  let server: TestAgent;
  let app: express.Application;

  beforeEach(async function () {
    process.env.REFRESH_TOKEN_SECRET = "testsecret1234";

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
});
