import flatten from "lodash/flatten";
import isArray from "lodash/isArray";
import merge from "lodash/merge";
import {Model} from "mongoose";
import m2s from "mongoose-to-swagger";

import {FernsRouterOptions, PopulatePaths} from "./api";
import {logger} from "./logger";

const noop = (_a, _b, next) => next();

const m2sOptions = {
  props: ["readOnly", "required", "enum", "default"],
};

export const apiErrorContent = {
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
export const defaultOpenApiErrorResponses = {
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

// Replaces populated properties with the populated schema.
export function convertModel(
  model: any,
  {
    populatePaths,
    extraModelProperties,
  }: {populatePaths?: PopulatePaths; extraModelProperties?: any} = {}
): {properties: any; required: string[]} {
  const modelSwagger = m2s(model, {
    props: ["required", "enum"],
  });

  // TODO: this should use OpenAPIs Components to fill in the referenced model instead.
  if (populatePaths && isArray(populatePaths)) {
    // Get the referenced populate model from the model schema.

    populatePaths.forEach((populatePath) => {
      let populateModel = model.schema.path(populatePath).options.ref;
      const populatePathIsArray = Array.isArray(model.schema.path(populatePath).options.type);
      if (populatePathIsArray) {
        populateModel = model.schema.path(populatePath).options.type[0].ref;
      }
      if (!populateModel) {
        return;
      }
      // Replace the populated property with the populated model schema.
      if (populatePathIsArray) {
        modelSwagger.properties[populatePath] = {
          type: "array",
          items: {
            type: "object",
            properties: m2s(model.db.model(populateModel), m2sOptions).properties,
          },
        };
      } else {
        modelSwagger.properties[populatePath] = {
          type: "object",
          properties: m2s(model.db.model(populateModel), m2sOptions).properties,
        };
      }
    });
  }

  // Add virtuals to the modelSwagger property
  for (const virtual of Object.keys(model.schema.virtuals)) {
    // This can be added using "omitMongooseInternals" in m2sOptions, so skip it here
    if (virtual === "id" || virtual === "__v") {
      continue;
    }
    modelSwagger.properties[virtual] = {
      type: "any",
    };
  }

  return {
    properties: {...modelSwagger.properties, ...extraModelProperties},
    required: modelSwagger.required ?? [],
  };
}

export function getOpenApiMiddleware<T>(model: Model<T>, options: Partial<FernsRouterOptions<T>>) {
  if (!options.openApi?.path) {
    // Just log this once rather than for each middleware.
    logger.debug("No options.openApi provided, skipping *OpenApiMiddleware");
    return noop;
  }

  if (options.permissions?.read?.length === 0) {
    return noop;
  }

  const {properties, required} = convertModel(model, {
    populatePaths: options.populatePaths,
    extraModelProperties: options.openApiExtraModelProperties,
  });

  return options.openApi.path(
    merge(
      {
        tags: [model.collection.collectionName],
        responses: {
          200: {
            description: "Successful read",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [...required, "_id", "created", "updated"],
                  properties,
                },
              },
            },
          },
          ...defaultOpenApiErrorResponses,
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

  const modelSwagger = m2s(model, m2sOptions);

  // TODO: handle permissions
  // TODO: handle whitelist/transform

  // Convert fernsRouter queryFields into OpenAPI parameters
  const defaultQueryParams = [
    {
      name: "_id",
      in: "query",
      schema: {
        type: "object",
        properties: {
          $in: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
    },
  ];
  const modelQueryParams = flatten(
    options.queryFields
      // Remove _id from queryFields, we handle that above.
      ?.filter((field) => field !== "_id")
      .map((field) => {
        const params: {name: string; in: "query"; schema: any}[] = [];

        // Check for datetime/number to support gt/gte/lt/lte
        if (
          modelSwagger.properties[field]?.type === "number" ||
          modelSwagger.properties[field]?.format === "date-time"
        ) {
          params.push({
            name: field,
            in: "query",
            schema: {
              type: "object",
              properties: {
                $gte: modelSwagger.properties[field],
                $gt: modelSwagger.properties[field],
                $lte: modelSwagger.properties[field],
                $lt: modelSwagger.properties[field],
              },
            },
          });
        } else {
          params.push({
            name: field,
            in: "query",
            schema: {
              oneOf: [
                modelSwagger.properties[field],
                {
                  type: "object",
                  properties: {
                    $in: {
                      type: "array",
                      items: {
                        type: modelSwagger.properties[field]?.type,
                      },
                    },
                  },
                }
              ]
            },
          });
        }

        return params;
      })
  );

  const {properties, required} = convertModel(model, {
    populatePaths: options.populatePaths,
    extraModelProperties: options.openApiExtraModelProperties,
  });
  return options.openApi.path(
    merge(
      {
        tags: [model.collection.collectionName],
        parameters: [
          ...defaultQueryParams,
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
                        required: [...required, "_id", "created", "updated"],
                        properties,
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
          ...defaultOpenApiErrorResponses,
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

  const {properties, required} = convertModel(model, {
    populatePaths: options.populatePaths,
    extraModelProperties: options.openApiExtraModelProperties,
  });
  return options.openApi.path(
    merge(
      {
        tags: [model.collection.collectionName],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties,
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
                  required: [...required, "_id", "created", "updated"],
                  properties,
                },
              },
            },
          },
          ...defaultOpenApiErrorResponses,
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

  const {properties, required} = convertModel(model, {
    populatePaths: options.populatePaths,
    extraModelProperties: options.openApiExtraModelProperties,
  });
  return options.openApi.path(
    merge(
      {
        tags: [model.collection.collectionName],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties,
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
                  required: [...required, "_id", "created", "updated"],
                  properties,
                },
              },
            },
          },
          ...defaultOpenApiErrorResponses,
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
        tags: [model.collection.collectionName],
        responses: {
          204: {
            description: "Successful delete",
          },
          ...defaultOpenApiErrorResponses,
        },
      },
      options.openApiOverwrite?.delete ?? {}
    )
  );
}
