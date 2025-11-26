import {assert} from "chai";
import express, {Router} from "express";
import supertest from "supertest";
import TestAgent from "supertest/lib/agent";

import {FernsRouterOptions, fernsRouter} from "./api";
import {addAuthRoutes, setupAuth} from "./auth";
import {setupServer} from "./expressServer";
import {createOpenApiBuilder, OpenApiMiddlewareBuilder} from "./openApiBuilder";
import {Permissions} from "./permissions";
import {FoodModel, UserModel} from "./tests";

function addRoutesWithBuilder(router: Router, options?: Partial<FernsRouterOptions<any>>): void {
  // Add a custom endpoint using the OpenApiMiddlewareBuilder
  const statsMiddleware = createOpenApiBuilder(options ?? {})
    .withTags(["Stats"])
    .withSummary("Get food statistics")
    .withDescription("Returns aggregated statistics about food items")
    .withQueryParameter("category", {type: "string"}, {
      description: "Filter by food category",
      required: false,
    })
    .withResponse<{count: number; avgCalories: number}>(200, {
      count: {type: "number", description: "Total number of food items"},
      avgCalories: {type: "number", description: "Average calories"},
    })
    .build();

  router.get("/food/stats", statsMiddleware, async (_req, res) => {
    res.json({count: 10, avgCalories: 250});
  });

  // Add endpoint with request body
  const createReportMiddleware = createOpenApiBuilder(options ?? {})
    .withTags(["Reports"])
    .withSummary("Create a food report")
    .withDescription("Generates a report based on provided criteria")
    .withRequestBody<{startDate: string; endDate: string; includeDeleted: boolean}>({
      startDate: {type: "string", format: "date", required: true, description: "Report start date"},
      endDate: {type: "string", format: "date", required: true, description: "Report end date"},
      includeDeleted: {type: "boolean", description: "Whether to include deleted items"},
    })
    .withResponse<{reportId: string}>(201, {
      reportId: {type: "string", description: "Generated report ID"},
    }, {description: "Report created successfully"})
    .build();

  router.post("/food/reports", createReportMiddleware, async (_req, res) => {
    res.status(201).json({reportId: "report-123"});
  });

  // Add endpoint with array response
  const listCategoriesMiddleware = createOpenApiBuilder(options ?? {})
    .withTags(["Categories"])
    .withSummary("List food categories")
    .withArrayResponse<{id: string; name: string; count: number}>(200, {
      id: {type: "string", description: "Category ID"},
      name: {type: "string", description: "Category name"},
      count: {type: "number", description: "Number of items in category"},
    }, {description: "List of categories"})
    .build();

  router.get("/food/categories", listCategoriesMiddleware, async (_req, res) => {
    res.json([
      {id: "1", name: "Fruits", count: 5},
      {id: "2", name: "Vegetables", count: 3},
    ]);
  });

  // Add endpoint with path parameter
  const getCategoryMiddleware = createOpenApiBuilder(options ?? {})
    .withTags(["Categories"])
    .withSummary("Get category by ID")
    .withPathParameter("categoryId", {type: "string"}, {
      description: "The category identifier",
    })
    .withResponse<{id: string; name: string}>(200, {
      id: {type: "string"},
      name: {type: "string"},
    })
    .withResponse(404, "Category not found")
    .build();

  router.get("/food/categories/:categoryId", getCategoryMiddleware, async (req, res) => {
    res.json({id: req.params.categoryId, name: "Fruits"});
  });

  // Standard fernsRouter for food
  router.use(
    "/food",
    fernsRouter(FoodModel as any, {
      ...options,
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
}

describe("OpenApiMiddlewareBuilder", function () {
  let server: TestAgent;
  let app: express.Application;

  beforeEach(async function () {
    process.env.REFRESH_TOKEN_SECRET = "testsecret1234";
    process.env.ENABLE_SWAGGER = "true";

    app = setupServer({addRoutes: addRoutesWithBuilder, userModel: UserModel as any, skipListen: true});
    setupAuth(app, UserModel as any);
    addAuthRoutes(app, UserModel as any);
  });

  describe("builder pattern", function () {
    it("returns a builder instance from createOpenApiBuilder", function () {
      const builder = createOpenApiBuilder({});
      expect(builder).toBeInstanceOf(OpenApiMiddlewareBuilder);
    });

    it("supports method chaining", function () {
      const builder = createOpenApiBuilder({});
      const result = builder
        .withTags(["test"])
        .withSummary("Test summary")
        .withDescription("Test description");

      expect(result).toBe(builder);
    });

    it("returns noop middleware when openApi is not configured", function () {
      const middleware = createOpenApiBuilder({}).build();
      expect(typeof middleware).toBe("function");
      expect(middleware.length).toBe(3); // Express middleware signature
    });
  });

  describe("OpenAPI spec generation", function () {
    it("includes custom endpoint with query parameter in OpenAPI spec", async function () {
      server = supertest(app);
      const res = await server.get("/openapi.json").expect(200);

      const statsPath = res.body.paths["/food/stats"];
      expect(statsPath).toBeDefined();
      expect(statsPath.get).toBeDefined();
      expect(statsPath.get.tags).toContain("Stats");
      expect(statsPath.get.summary).toBe("Get food statistics");
      expect(statsPath.get.description).toBe("Returns aggregated statistics about food items");

      // Check query parameter
      const categoryParam = statsPath.get.parameters.find((p: any) => p.name === "category");
      expect(categoryParam).toBeDefined();
      expect(categoryParam.in).toBe("query");
      expect(categoryParam.schema.type).toBe("string");
      expect(categoryParam.description).toBe("Filter by food category");
      expect(categoryParam.required).toBe(false);
    });

    it("includes request body schema in OpenAPI spec", async function () {
      server = supertest(app);
      const res = await server.get("/openapi.json").expect(200);

      const reportsPath = res.body.paths["/food/reports"];
      expect(reportsPath).toBeDefined();
      expect(reportsPath.post).toBeDefined();
      expect(reportsPath.post.tags).toContain("Reports");

      const requestBody = reportsPath.post.requestBody;
      expect(requestBody).toBeDefined();
      expect(requestBody.required).toBe(true);

      const schema = requestBody.content["application/json"].schema;
      expect(schema.type).toBe("object");
      expect(schema.properties.startDate.type).toBe("string");
      expect(schema.properties.startDate.format).toBe("date");
      expect(schema.properties.endDate.type).toBe("string");
      expect(schema.properties.includeDeleted.type).toBe("boolean");
      expect(schema.required).toContain("startDate");
      expect(schema.required).toContain("endDate");
      expect(schema.required).not.toContain("includeDeleted");
    });

    it("includes response schema in OpenAPI spec", async function () {
      server = supertest(app);
      const res = await server.get("/openapi.json").expect(200);

      const statsPath = res.body.paths["/food/stats"];
      const response200 = statsPath.get.responses["200"];
      expect(response200).toBeDefined();
      expect(response200.description).toBe("Success");

      const schema = response200.content["application/json"].schema;
      expect(schema.type).toBe("object");
      expect(schema.properties.count.type).toBe("number");
      expect(schema.properties.avgCalories.type).toBe("number");
    });

    it("includes array response schema in OpenAPI spec", async function () {
      server = supertest(app);
      const res = await server.get("/openapi.json").expect(200);

      const categoriesPath = res.body.paths["/food/categories"];
      expect(categoriesPath).toBeDefined();

      const response200 = categoriesPath.get.responses["200"];
      expect(response200.description).toBe("List of categories");

      const schema = response200.content["application/json"].schema;
      expect(schema.type).toBe("array");
      expect(schema.items.type).toBe("object");
      expect(schema.items.properties.id.type).toBe("string");
      expect(schema.items.properties.name.type).toBe("string");
      expect(schema.items.properties.count.type).toBe("number");
    });

    it("includes path parameter in OpenAPI spec", async function () {
      server = supertest(app);
      const res = await server.get("/openapi.json").expect(200);

      const categoryPath = res.body.paths["/food/categories/{categoryId}"];
      expect(categoryPath).toBeDefined();

      const pathParam = categoryPath.get.parameters.find((p: any) => p.name === "categoryId");
      expect(pathParam).toBeDefined();
      expect(pathParam.in).toBe("path");
      expect(pathParam.required).toBe(true);
      expect(pathParam.schema.type).toBe("string");
      expect(pathParam.description).toBe("The category identifier");
    });

    it("includes custom response without body in OpenAPI spec", async function () {
      server = supertest(app);
      const res = await server.get("/openapi.json").expect(200);

      // Test with the 201 response from reports endpoint which has a custom description
      const reportsPath = res.body.paths["/food/reports"];
      const response201 = reportsPath.post.responses["201"];
      expect(response201).toBeDefined();
      expect(response201.description).toBe("Report created successfully");
      expect(response201.content).toBeDefined();
    });

    it("includes default error responses", async function () {
      server = supertest(app);
      const res = await server.get("/openapi.json").expect(200);

      const statsPath = res.body.paths["/food/stats"];
      const responses = statsPath.get.responses;

      // Default error responses should be merged
      expect(responses["400"]).toBeDefined();
      expect(responses["401"]).toBeDefined();
      expect(responses["403"]).toBeDefined();
      expect(responses["404"]).toBeDefined();
      expect(responses["405"]).toBeDefined();
    });
  });

  describe("endpoint functionality", function () {
    it("stats endpoint returns correct data", async function () {
      server = supertest(app);
      const res = await server.get("/food/stats").expect(200);
      expect(res.body).toEqual({count: 10, avgCalories: 250});
    });

    it("reports endpoint returns correct data", async function () {
      server = supertest(app);
      const res = await server
        .post("/food/reports")
        .send({startDate: "2024-01-01", endDate: "2024-12-31"})
        .expect(201);
      expect(res.body).toEqual({reportId: "report-123"});
    });

    it("categories endpoint returns array data", async function () {
      server = supertest(app);
      const res = await server.get("/food/categories").expect(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty("id");
      expect(res.body[0]).toHaveProperty("name");
    });

    it("category by id endpoint returns correct data", async function () {
      server = supertest(app);
      const res = await server.get("/food/categories/cat-123").expect(200);
      expect(res.body).toEqual({id: "cat-123", name: "Fruits"});
    });
  });

  describe("snapshot tests", function () {
    it("matches OpenAPI spec snapshot", async function () {
      server = supertest(app);
      const res = await server.get("/openapi.json").expect(200);
      expect(res.body).toMatchSnapshot();
    });
  });
});

describe("OpenApiMiddlewareBuilder without OpenAPI", function () {
  it("build returns noop middleware when openApi.path is not configured", function () {
    const builder = new OpenApiMiddlewareBuilder({});
    const middleware = builder
      .withTags(["test"])
      .withSummary("Test")
      .withResponse(200, {id: {type: "string"}})
      .build();

    // Middleware should be a function
    expect(typeof middleware).toBe("function");

    // Should call next() without error
    let nextCalled = false;
    middleware({}, {}, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });

  it("build returns noop middleware when options is empty", function () {
    const middleware = createOpenApiBuilder({}).build();

    let nextCalled = false;
    middleware({}, {}, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });
});

describe("OpenApiMiddlewareBuilder configuration", function () {
  it("correctly extracts required fields from request body schema", function () {
    // We can't easily test this without a mock openApi.path, but we can at least
    // verify the builder accepts the configuration
    const builder = createOpenApiBuilder({})
      .withRequestBody<{required1: string; required2: string; optional: string}>({
        required1: {type: "string", required: true},
        required2: {type: "string", required: true},
        optional: {type: "string"},
      });

    expect(builder).toBeInstanceOf(OpenApiMiddlewareBuilder);
  });

  it("supports custom media types for request body", function () {
    const builder = createOpenApiBuilder({})
      .withRequestBody(
        {data: {type: "string"}},
        {mediaType: "application/xml"}
      );

    expect(builder).toBeInstanceOf(OpenApiMiddlewareBuilder);
  });

  it("supports custom media types for response", function () {
    const builder = createOpenApiBuilder({})
      .withResponse(200, {data: {type: "string"}}, {mediaType: "text/plain"});

    expect(builder).toBeInstanceOf(OpenApiMiddlewareBuilder);
  });

  it("supports optional request body", function () {
    const builder = createOpenApiBuilder({})
      .withRequestBody(
        {data: {type: "string"}},
        {required: false}
      );

    expect(builder).toBeInstanceOf(OpenApiMiddlewareBuilder);
  });

  it("supports multiple query parameters", function () {
    const builder = createOpenApiBuilder({})
      .withQueryParameter("limit", {type: "number"}, {required: false})
      .withQueryParameter("offset", {type: "number"}, {required: false})
      .withQueryParameter("search", {type: "string"});

    expect(builder).toBeInstanceOf(OpenApiMiddlewareBuilder);
  });

  it("supports multiple path parameters", function () {
    const builder = createOpenApiBuilder({})
      .withPathParameter("userId", {type: "string"})
      .withPathParameter("postId", {type: "string"});

    expect(builder).toBeInstanceOf(OpenApiMiddlewareBuilder);
  });

  it("supports multiple responses", function () {
    const builder = createOpenApiBuilder({})
      .withResponse(200, {data: {type: "string"}})
      .withResponse(201, {id: {type: "string"}})
      .withResponse(204, "No content")
      .withResponse(404, "Not found");

    expect(builder).toBeInstanceOf(OpenApiMiddlewareBuilder);
  });
});
