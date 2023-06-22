import merge from "lodash/merge";
import {Model} from "mongoose";
import m2s from "mongoose-to-swagger";

import {FernsRouterOptions} from "./api";
import {logger} from "./logger";

const noop = (_a, _b, next) => next();

const apiErrorContent = {
  "application/json": {
    schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The error message",
        },
        status: {
          type: "number",
          description:
            "The HTTP status code applicable to this problem, expressed as a string value.",
        },
        id: {
          type: "string",
          description: "A unique identifier for this particular occurrence of the problem.",
        },
        links: {
          type: "object",
          properties: {
            about: {
              type: "string",
              description:
                "A link that leads to further details about this particular occurrence of the problem. When derefenced, this URI SHOULD return a human-readable description of the error.",
            },
            type: {
              type: "string",
              description:
                "A link that identifies the type of error that this particular error is an instance of. This URI SHOULD be dereferencable to a human-readable explanation of the general error.",
            },
          },
        },
        code: {
          type: "string",
          description: "An application-specific error code, expressed as a string value.",
        },
        detail: {
          type: "string",
          description:
            "A human-readable explanation specific to this occurrence of the problem. Like title, this field’s value can be localized.",
        },
        source: {
          type: "object",
          properties: {
            pointer: {
              type: "string",
              description:
                'A JSON Pointer [RFC6901] to the associated entity in the request document [e.g. "/data" for a primary data object, or "/data/attributes/title" for a specific attribute].',
            },
            parameter: {
              type: "string",
              description: "A string indicating which URI query parameter caused the error.",
            },
            header: {
              type: "string",
              description:
                "A string indicating the name of a single request header which caused the error.",
            },
          },
        },
        meta: {
          type: "object",
          description: "A meta object containing non-standard meta-information about the error.",
        },
      },
    },
  },
};

// Default error responses
const defaultErrorResponses = {
  400: {
    description: "Bad request",
    content: apiErrorContent,
  },
  401: {
    description: "The user must be authenticated",
  },
  403: {
    description: "The user is not allowed to perform this action on this document",
    content: apiErrorContent,
  },
  404: {
    description: "Document not found",
    content: apiErrorContent,
  },
  405: {
    description: "The user is not allowed to perform this action on any document",
    content: apiErrorContent,
  },
};

export function getOpenApiMiddleware<T>(model: Model<T>, options: Partial<FernsRouterOptions<T>>) {
  if (!options.openApi?.path) {
    // Just log this once rather than for each middleware.
    logger.debug("No options.openApi provided, skipping *OpenApiMiddleware");
    return noop;
  }

  if (options.permissions?.read?.length === 0) {
    return noop;
  }

  const modelSwagger = m2s(model, {props: ["required", "enum"]});

  return options.openApi.path(
    merge(
      {
        responses: {
          200: {
            description: "Successful read",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [...(modelSwagger.required ?? []), "_id", "created", "updated"],
                  properties: modelSwagger.properties,
                },
              },
            },
          },
          ...defaultErrorResponses,
        },
      },
      options.openApiOverwrite?.get ?? {}
    )
  );
}

export function listOpenApiMiddleware<T>(model: Model<T>, options: Partial<FernsRouterOptions<T>>) {
  if (!options.openApi?.path) {
    return noop;
  }

  if (options.permissions?.list?.length === 0) {
    return noop;
  }

  const modelSwagger = m2s(model);

  // TODO: handle permissions
  // TODO: handle populate
  // TODO: handle whitelist/transform

  // Convert fernsRouter queryFields into OpenAPI parameters
  const modelQueryParams = options.queryFields?.map((field) => {
    return {
      name: field,
      in: "query",
      schema: modelSwagger.properties[field],
    };
  });

  return options.openApi.path(
    merge(
      {
        parameters: [
          ...(modelQueryParams ?? []),
          // pagination
          {
            name: "page",
            in: "query",
            schema: {
              type: "number",
            },
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "number",
            },
          },
          // special param for period, like "1d"
          {
            name: "period",
            in: "query",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "Successful list",

            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        required: [...(modelSwagger.required ?? []), "_id", "created", "updated"],
                        properties: modelSwagger.properties,
                      },
                    },
                    more: {
                      type: "boolean",
                    },
                    page: {
                      type: "number",
                    },
                    limit: {
                      type: "number",
                    },
                    total: {
                      type: "number",
                    },
                  },
                },
              },
            },
          },
          ...defaultErrorResponses,
        },
      },
      options.openApiOverwrite?.list ?? {}
    )
  );
}

export function createOpenApiMiddleware<T>(
  model: Model<T>,
  options: Partial<FernsRouterOptions<T>>
) {
  if (!options.openApi?.path) {
    return noop;
  }

  if (options.permissions?.create?.length === 0) {
    return noop;
  }

  const modelSwagger = m2s(model);

  return options.openApi.path(
    merge(
      {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: modelSwagger.required,
                properties: modelSwagger.properties,
              },
            },
          },
        },
        responses: {
          201: {
            description: "Successful create",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [...(modelSwagger.required ?? []), "_id", "created", "updated"],
                  properties: modelSwagger.properties,
                },
              },
            },
          },
          ...defaultErrorResponses,
        },
      },
      options.openApiOverwrite?.create ?? {}
    )
  );
}

export function patchOpenApiMiddleware<T>(
  model: Model<T>,
  options: Partial<FernsRouterOptions<T>>
) {
  if (!options.openApi?.path) {
    return noop;
  }

  if (options.permissions?.update?.length === 0) {
    return noop;
  }

  const modelSwagger = m2s(model);

  return options.openApi.path(
    merge(
      {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: modelSwagger.required,
                properties: modelSwagger.properties,
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successful update",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [...(modelSwagger.required ?? []), "_id", "created", "updated"],
                  properties: modelSwagger.properties,
                },
              },
            },
          },
          ...defaultErrorResponses,
        },
      },
      options.openApiOverwrite?.update ?? {}
    )
  );
}

export function deleteOpenApiMiddleware<T>(
  model: Model<T>,
  options: Partial<FernsRouterOptions<T>>
) {
  if (!options.openApi?.path) {
    return noop;
  }

  if (options.permissions?.delete?.length === 0) {
    return noop;
  }

  return options.openApi.path(
    merge(
      {
        responses: {
          204: {
            description: "Successful delete",
          },
          ...defaultErrorResponses,
        },
      },
      options.openApiOverwrite?.delete ?? {}
    )
  );
}
