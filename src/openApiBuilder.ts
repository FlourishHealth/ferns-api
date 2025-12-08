/**
 * OpenAPI Middleware Builder
 *
 * This module provides a fluent builder pattern for constructing OpenAPI middleware
 * for Express routes that don't directly map to Mongoose models. It allows you to
 * define custom API documentation with full control over request/response schemas.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import {createOpenApiBuilder} from "./openApiBuilder";
 *
 * // Create middleware with custom documentation
 * const middleware = createOpenApiBuilder(options)
 *   .withTags(["users"])
 *   .withSummary("Get user statistics")
 *   .withDescription("Returns aggregated statistics for the current user")
 *   .withQueryParameter("period", {type: "string"}, {
 *     description: "Time period for statistics",
 *     required: false,
 *   })
 *   .withResponse<{count: number; average: number}>(200, {
 *     count: {type: "number", description: "Total count"},
 *     average: {type: "number", description: "Average value"},
 *   })
 *   .build();
 *
 * router.get("/stats", middleware, statsHandler);
 * ```
 */
import merge from "lodash/merge";

import {FernsRouterOptions} from "./api";
import {logger} from "./logger";
import {defaultOpenApiErrorResponses} from "./openApi";

/**
 * Defines a property within an OpenAPI schema.
 *
 * This type represents the structure of individual properties in request bodies,
 * response objects, and nested schemas. It supports primitive types, arrays,
 * nested objects, and additional properties for map-like structures.
 *
 * @example
 * ```typescript
 * // Simple string property
 * const nameProperty: OpenApiSchemaProperty = {
 *   type: "string",
 *   description: "User's full name",
 * };
 *
 * // Array of objects
 * const itemsProperty: OpenApiSchemaProperty = {
 *   type: "array",
 *   items: {
 *     type: "object",
 *     properties: {
 *       id: {type: "string"},
 *       value: {type: "number"},
 *     },
 *   },
 * };
 *
 * // Object with additional properties (map/dictionary)
 * const metadataProperty: OpenApiSchemaProperty = {
 *   type: "object",
 *   additionalProperties: {type: "string"},
 * };
 * ```
 */
export type OpenApiSchemaProperty = {
  /** The JSON Schema type (e.g., "string", "number", "boolean", "object", "array") */
  type: string;
  /** Human-readable description of the property */
  description?: string;
  /** Format hint for the type (e.g., "date-time", "email", "uri", "uuid") */
  format?: string;
  /** Schema for array items when type is "array" */
  items?: OpenApiSchemaProperty;
  /** Nested properties when type is "object" */
  properties?: Record<string, OpenApiSchemaProperty>;
  /** Schema for additional properties or boolean to allow/disallow them */
  additionalProperties?: OpenApiSchemaProperty | boolean;
  /** Whether this property is required in the parent object */
  required?: boolean;
};

/**
 * Defines the top-level schema for request bodies and responses.
 *
 * This type represents complete object schemas used in OpenAPI operations,
 * typically for request bodies and response content.
 *
 * @example
 * ```typescript
 * const userSchema: OpenApiSchema = {
 *   type: "object",
 *   properties: {
 *     id: {type: "string"},
 *     name: {type: "string"},
 *     email: {type: "string", format: "email"},
 *   },
 *   required: ["id", "name"],
 * };
 * ```
 */
export type OpenApiSchema = {
  /** The JSON Schema type (typically "object" or "array") */
  type: string;
  /** Property definitions for object types */
  properties?: Record<string, OpenApiSchemaProperty>;
  /** List of required property names */
  required?: string[];
  /** Schema for array items when type is "array" */
  items?: OpenApiSchemaProperty;
  /** Schema for additional properties or boolean to allow/disallow them */
  additionalProperties?: OpenApiSchemaProperty | boolean;
};

/**
 * Defines a parameter in an OpenAPI operation.
 *
 * Parameters can be passed via query string, path segments, or headers.
 * Path parameters are always required by OpenAPI specification.
 *
 * @example
 * ```typescript
 * // Query parameter
 * const limitParam: OpenApiParameter = {
 *   in: "query",
 *   name: "limit",
 *   required: false,
 *   schema: {type: "number"},
 *   description: "Maximum number of results",
 * };
 *
 * // Path parameter
 * const idParam: OpenApiParameter = {
 *   in: "path",
 *   name: "id",
 *   required: true,
 *   schema: {type: "string"},
 *   description: "Resource identifier",
 * };
 * ```
 */
export type OpenApiParameter = {
  /** Location of the parameter */
  in: "query" | "path" | "header";
  /** Name of the parameter */
  name: string;
  /** Whether the parameter is required (path params are always required) */
  required?: boolean;
  /** Schema defining the parameter's type and format */
  schema: OpenApiSchemaProperty;
  /** Human-readable description of the parameter */
  description?: string;
};

/**
 * Defines a response in an OpenAPI operation.
 *
 * Responses include a description and optionally content with a schema
 * for the response body.
 *
 * @example
 * ```typescript
 * const successResponse: OpenApiResponse = {
 *   description: "Successfully retrieved user",
 *   content: {
 *     "application/json": {
 *       schema: {
 *         type: "object",
 *         properties: {
 *           id: {type: "string"},
 *           name: {type: "string"},
 *         },
 *       },
 *     },
 *   },
 * };
 * ```
 */
export type OpenApiResponse = {
  /** Human-readable description of the response */
  description: string;
  /** Content definitions keyed by media type */
  content?: {
    [mediaType: string]: {
      schema: OpenApiSchema;
    };
  };
};

/**
 * Internal configuration object for the OpenAPI middleware builder.
 *
 * This interface represents the accumulated configuration from builder method calls.
 */
interface OpenApiConfig {
  /** Tags for grouping operations in API documentation */
  tags?: string[];
  /** Short summary of the operation */
  summary?: string;
  /** Detailed description of the operation */
  description?: string;
  /** Operation parameters (query, path, header) */
  parameters?: OpenApiParameter[];
  /** Request body configuration */
  requestBody?: {
    /** Whether the request body is required */
    required?: boolean;
    /** Content definitions keyed by media type */
    content: {
      [mediaType: string]: {
        schema: OpenApiSchema;
      };
    };
  };
  /** Response definitions keyed by status code */
  responses: Record<number | string, OpenApiResponse>;
}

/**
 * A fluent builder for constructing OpenAPI middleware.
 *
 * This class provides a chainable API for defining OpenAPI documentation
 * for Express routes. It supports defining tags, summaries, descriptions,
 * request bodies, responses, and parameters.
 *
 * The builder pattern allows for flexible, readable configuration that
 * produces middleware compatible with the express-openapi-validator library.
 *
 * @example
 * ```typescript
 * const middleware = new OpenApiMiddlewareBuilder(options)
 *   .withTags(["users"])
 *   .withSummary("Create a new user")
 *   .withRequestBody<{name: string; email: string}>({
 *     name: {type: "string", required: true},
 *     email: {type: "string", format: "email", required: true},
 *   })
 *   .withResponse<{id: string; name: string}>(201, {
 *     id: {type: "string"},
 *     name: {type: "string"},
 *   })
 *   .build();
 * ```
 */
export class OpenApiMiddlewareBuilder {
  /** Router options containing OpenAPI configuration */
  private options: Partial<FernsRouterOptions<any>>;

  /** Accumulated OpenAPI configuration from builder methods */
  private config: OpenApiConfig;

  /**
   * Creates a new OpenApiMiddlewareBuilder instance.
   *
   * @param options - Router options containing the OpenAPI path configuration
   */
  constructor(options: Partial<FernsRouterOptions<any>>) {
    this.options = options;
    this.config = {
      responses: {},
    };
  }

  /**
   * Sets the tags for the OpenAPI operation.
   *
   * Tags are used to group operations in the API documentation.
   *
   * @param tags - Array of tag names
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.withTags(["users", "authentication"]);
   * ```
   */
  withTags(tags: string[]): this {
    this.config.tags = tags;
    return this;
  }

  /**
   * Sets the summary for the OpenAPI operation.
   *
   * The summary is a brief description shown in API documentation listings.
   *
   * @param summary - Short description of the operation
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.withSummary("Get user by ID");
   * ```
   */
  withSummary(summary: string): this {
    this.config.summary = summary;
    return this;
  }

  /**
   * Sets the description for the OpenAPI operation.
   *
   * The description provides detailed information about the operation,
   * including usage notes, examples, and caveats.
   *
   * @param description - Detailed description of the operation
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.withDescription("Retrieves a user by their unique identifier. Returns 404 if not found.");
   * ```
   */
  withDescription(description: string): this {
    this.config.description = description;
    return this;
  }

  /**
   * Sets the request body schema for the OpenAPI operation.
   *
   * Properties marked with `required: true` will be added to the schema's
   * required array automatically.
   *
   * @typeParam T - Type representing the request body structure
   * @param schema - Object mapping property names to their OpenAPI schema definitions
   * @param options - Optional configuration for the request body
   * @param options.required - Whether the request body itself is required (default: true)
   * @param options.mediaType - Media type for the request body (default: "application/json")
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.withRequestBody<{name: string; age: number}>({
   *   name: {type: "string", description: "User name", required: true},
   *   age: {type: "number", description: "User age"},
   * });
   * ```
   */
  withRequestBody<T extends Record<string, any>>(
    schema: {
      [K in keyof T]: OpenApiSchemaProperty;
    },
    options?: {
      required?: boolean;
      mediaType?: string;
    }
  ): this {
    const required = Object.entries(schema)
      .filter(([_, prop]) => prop.required)
      .map(([key, _]) => key);

    this.config.requestBody = {
      required: options?.required ?? true,
      content: {
        [options?.mediaType ?? "application/json"]: {
          schema: {
            type: "object",
            properties: schema,
            required: required.length > 0 ? required : undefined,
          },
        },
      },
    };
    return this;
  }

  /**
   * Adds a response definition to the OpenAPI operation.
   *
   * Can accept either an object schema or a simple string description
   * for responses without a body (e.g., 204 No Content).
   *
   * @typeParam T - Type representing the response body structure
   * @param statusCode - HTTP status code for this response
   * @param schema - Either an object schema or a description string
   * @param options - Optional configuration for the response
   * @param options.description - Description of the response (default: "Success")
   * @param options.mediaType - Media type for the response (default: "application/json")
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * // Response with body
   * builder.withResponse<{id: string}>(200, {
   *   id: {type: "string", description: "Created resource ID"},
   * }, {description: "Resource created successfully"});
   *
   * // Response without body
   * builder.withResponse(204, "No content");
   * ```
   */
  withResponse<T extends Record<string, any>>(
    statusCode: number,
    schema:
      | {
          [K in keyof T]: OpenApiSchemaProperty;
        }
      | string,
    options?: {
      description?: string;
      mediaType?: string;
    }
  ): this {
    if (typeof schema === "string") {
      this.config.responses[statusCode] = {
        description: schema,
      };
    } else {
      this.config.responses[statusCode] = {
        description: options?.description ?? "Success",
        content: {
          [options?.mediaType ?? "application/json"]: {
            schema: {
              type: "object",
              properties: schema,
            },
          },
        },
      };
    }
    return this;
  }

  /**
   * Adds an array response definition to the OpenAPI operation.
   *
   * Use this method when the response is an array of objects rather
   * than a single object.
   *
   * @typeParam T - Type representing the structure of each array item
   * @param statusCode - HTTP status code for this response
   * @param itemSchema - Schema for each item in the response array
   * @param options - Optional configuration for the response
   * @param options.description - Description of the response (default: "Success")
   * @param options.mediaType - Media type for the response (default: "application/json")
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.withArrayResponse<{id: string; name: string}>(200, {
   *   id: {type: "string"},
   *   name: {type: "string"},
   * }, {description: "List of users"});
   * ```
   */
  withArrayResponse<T extends Record<string, any>>(
    statusCode: number,
    itemSchema: {
      [K in keyof T]: OpenApiSchemaProperty;
    },
    options?: {
      description?: string;
      mediaType?: string;
    }
  ): this {
    this.config.responses[statusCode] = {
      description: options?.description ?? "Success",
      content: {
        [options?.mediaType ?? "application/json"]: {
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: itemSchema,
            },
          },
        },
      },
    };
    return this;
  }

  /**
   * Adds a query parameter to the OpenAPI operation.
   *
   * Query parameters are passed in the URL query string (e.g., `?limit=10`).
   *
   * @param name - Name of the query parameter
   * @param schema - Schema defining the parameter's type and format
   * @param options - Optional configuration for the parameter
   * @param options.required - Whether the parameter is required (default: false)
   * @param options.description - Human-readable description of the parameter
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.withQueryParameter("limit", {type: "number"}, {
   *   required: false,
   *   description: "Maximum number of results to return",
   * });
   * ```
   */
  withQueryParameter(
    name: string,
    schema: OpenApiSchemaProperty,
    options?: {
      required?: boolean;
      description?: string;
    }
  ): this {
    if (!this.config.parameters) {
      this.config.parameters = [];
    }
    this.config.parameters.push({
      in: "query",
      name,
      required: options?.required ?? false,
      schema,
      description: options?.description,
    });
    return this;
  }

  /**
   * Adds a path parameter to the OpenAPI operation.
   *
   * Path parameters are embedded in the URL path (e.g., `/users/:id`).
   * Path parameters are always required per OpenAPI specification.
   *
   * @param name - Name of the path parameter (must match the route parameter)
   * @param schema - Schema defining the parameter's type and format
   * @param options - Optional configuration for the parameter
   * @param options.description - Human-readable description of the parameter
   * @returns The builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.withPathParameter("id", {type: "string", format: "uuid"}, {
   *   description: "Unique identifier of the user",
   * });
   * ```
   */
  withPathParameter(
    name: string,
    schema: OpenApiSchemaProperty,
    options?: {
      description?: string;
    }
  ): this {
    if (!this.config.parameters) {
      this.config.parameters = [];
    }
    this.config.parameters.push({
      in: "path",
      name,
      required: true,
      schema,
      description: options?.description,
    });
    return this;
  }

  /**
   * Builds and returns the OpenAPI middleware.
   *
   * This method finalizes the configuration and returns Express middleware
   * that integrates with the OpenAPI documentation system. If no OpenAPI
   * path is configured in options, returns a no-op middleware.
   *
   * Default error responses (400, 401, 403, 404, 405) are automatically
   * merged with the configured responses.
   *
   * @returns Express middleware function for OpenAPI documentation
   *
   * @example
   * ```typescript
   * const middleware = builder
   *   .withTags(["users"])
   *   .withResponse(200, {id: {type: "string"}})
   *   .build();
   *
   * router.get("/users/:id", middleware, getUserHandler);
   * ```
   */
  build(): any {
    const noop = (_a: any, _b: any, next: () => void): void => next();

    if (!this.options.openApi?.path) {
      logger.debug("No options.openApi provided, skipping OpenApiMiddleware");
      return noop;
    }

    return this.options.openApi.path(
      merge(
        {
          ...this.config,
          responses: {
            ...this.config.responses,
            ...defaultOpenApiErrorResponses,
          },
        },
        this.options.openApiOverwrite?.get ?? {}
      )
    );
  }
}

/**
 * Creates a new OpenAPI middleware builder.
 *
 * This is the recommended entry point for creating custom OpenAPI middleware.
 * It returns a fluent builder that allows you to chain configuration methods.
 *
 * @param options - Router options containing the OpenAPI configuration
 * @returns A new OpenApiMiddlewareBuilder instance
 *
 * @example
 * ```typescript
 * import {createOpenApiBuilder} from "./openApiBuilder";
 *
 * const statsMiddleware = createOpenApiBuilder(options)
 *   .withTags(["analytics"])
 *   .withSummary("Get usage statistics")
 *   .withQueryParameter("startDate", {type: "string", format: "date"})
 *   .withQueryParameter("endDate", {type: "string", format: "date"})
 *   .withResponse<{totalUsers: number; activeUsers: number}>(200, {
 *     totalUsers: {type: "number", description: "Total registered users"},
 *     activeUsers: {type: "number", description: "Users active in period"},
 *   })
 *   .build();
 *
 * router.get("/analytics/stats", statsMiddleware, getStatsHandler);
 * ```
 */
export function createOpenApiBuilder(
  options: Partial<FernsRouterOptions<any>>
): OpenApiMiddlewareBuilder {
  return new OpenApiMiddlewareBuilder(options);
}
