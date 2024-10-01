import isArray from "lodash/isArray";
import {Document} from "mongoose";
import m2s from "mongoose-to-swagger";

import {APIError} from "./errors";

const m2sOptions = {
  props: ["readOnly", "required", "enum", "default"],
};

export type PopulatePath = {
  // Mongoose style path population.
  // "ownerId" // populates the User that matches `ownerId`
  // "ownerId.organizationId" Nested. Populates the User that matches `ownerId`, as well as their organization.
  path: string;
  // If provided, type generation will use the already registered component.
  // If not provided and path is provided, will use the path and optionally fields to
  // automatically generate the types. If only generatePathFields is provided, the type will be
  // any.
  openApiComponent?: any;
  // An array of strings to filter on the populated objects, following Mongoose's select
  // rules. If each field starts a preceding "-", will act as a block list and only remove those
  // fields. If each field does not start with a "-", will act as an allow list and only
  // return those fields.
  fields?: string[];
};

// This function filters an object to only include specified keys.
// It supports nested keys using dot notation (e.g., 'user.name').
// If no keys are provided, it returns the original object.
// The function recursively traverses the object structure to handle nested properties.
const filterKeys = (obj: Record<string, any>, keysToKeep?: string[]): Record<string, any> => {
  if (!keysToKeep) {
    return obj;
  }

  const result: Record<string, any> = {};

  const filterNestedKeys = (
    currentObj: Record<string, any>,
    currentResult: Record<string, any>,
    remainingKeys: string[]
  ) => {
    const currentKey = remainingKeys[0];
    const nestedKeys = currentKey.split(".");

    if (nestedKeys.length > 1) {
      const [firstKey, ...rest] = nestedKeys;
      if (!currentResult[firstKey]) {
        currentResult[firstKey] = {};
      }
      filterNestedKeys(currentObj[firstKey], currentResult[firstKey], [
        rest.join("."),
        ...remainingKeys.slice(1),
      ]);
    } else {
      if (currentObj.hasOwnProperty(currentKey)) {
        currentResult[currentKey] = currentObj[currentKey];
      }
      if (remainingKeys.length > 1) {
        filterNestedKeys(currentObj, currentResult, remainingKeys.slice(1));
      }
    }
  };

  filterNestedKeys(obj, result, keysToKeep);
  return result;
};

// Helper function to get the path in the OpenAPI schema, so we can swap out the type for the
// populated model component or generated type.
function getPathInSchema(schema: any, path: string): string {
  const keys = path.split(".");
  let currentSchema = schema;
  let fullPath = "";

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (currentSchema.properties && currentSchema.properties[key]) {
      fullPath += fullPath ? `.${key}` : key;
      currentSchema = currentSchema.properties[key];

      // If it's an array, add 'items' to the path
      if (currentSchema.type === "array" && currentSchema.items) {
        fullPath += ".items";
        currentSchema = currentSchema.items;
      }
    } else if (i === keys.length - 1 && currentSchema.type === "array") {
      // If we're at the last key and it's an array, we don't need to add anything
      break;
    } else {
      throw new Error(`Path ${path} not found in schema at key ${key}`);
    }
  }

  return fullPath;
}

// Replaces populated properties with the populated schema.
export function getOpenApiSpecForModel(
  model: any,
  {
    populatePaths,
    extraModelProperties,
  }: {populatePaths?: PopulatePath[]; extraModelProperties?: any} = {}
): {properties: any; required: string[]} {
  const modelSwagger = m2s(model, {
    props: ["required", "enum"],
  });

  if (populatePaths && isArray(populatePaths)) {
    populatePaths.forEach((populatePath) => {
      // Get the referenced populate model from the model schema
      let populateModel = model.schema.path(populatePath.path)?.options?.ref;
      const populatePathIsArray = Array.isArray(model.schema.path(populatePath.path).options.type);
      if (populatePathIsArray) {
        populateModel = model.schema.path(populatePath.path).options.type[0].ref;
      }
      if (!populateModel) {
        return;
      }

      // Get the properties of the referenced model
      const properties = filterKeys(
        m2s(model.db.model(populateModel), m2sOptions).properties,
        populatePath.fields
      );

      // Get the OpenAPI path for the current populate path
      const openApiPath = getPathInSchema(modelSwagger, populatePath.path);

      // Determine the schema to set
      let schemaToSet;
      if (populatePath.openApiComponent) {
        schemaToSet = {
          $ref: `#/components/schemas/${populatePath.openApiComponent}`,
        };
      } else {
        schemaToSet = {
          type: "object",
          properties,
        };
      }

      // Navigate through the nested structure and set the schema
      const pathParts = openApiPath.split(".");
      let currentSchema = modelSwagger.properties;
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (i === pathParts.length - 1) {
          // We're at the last part, merge the schema
          if (currentSchema[part] && currentSchema[part].properties) {
            currentSchema[part].properties = {
              ...currentSchema[part].properties,
              ...(schemaToSet.properties || {[part]: schemaToSet}),
            };
          } else {
            currentSchema[part] = schemaToSet;
          }
        } else {
          // We're still navigating, ensure the path exists
          if (!currentSchema[part]) {
            currentSchema[part] = {};
          }
          if (part === "items" && i < pathParts.length - 1) {
            // If we're at 'items' and it's not the last part, it should be an object
            if (!currentSchema[part].properties) {
              currentSchema[part] = {type: "object", properties: {}};
            }
          }
          currentSchema = currentSchema[part].properties || currentSchema[part];
        }
      }
    });
  }

  // Add virtuals to the modelSwagger property
  for (const virtual of Object.keys(model.schema.virtuals)) {
    // Skip Mongoose internals
    if (virtual === "id" || virtual === "__v") {
      continue;
    }
    modelSwagger.properties[virtual] = {
      type: "any",
    };
  }

  // Check subschemas for virtuals (one level deep)
  if (model.schema.childSchemas.length > 0) {
    for (const childSchema of model.schema.childSchemas) {
      for (const virtual of Object.keys(childSchema.schema.virtuals)) {
        if (virtual === "id" || virtual === "__v") {
          continue;
        }
        modelSwagger.properties[childSchema.model.path].properties[virtual] = {
          type: "any",
        };
      }
    }
  }

  return {
    properties: {...modelSwagger.properties, ...extraModelProperties},
    required: modelSwagger.required ?? [],
  };
}

// Helper function to unpopulate a document that has been populated.
// This is helpful for supporting backwards compatibility. E.g. you use populatePaths
// to populate a document but if the version header for the request is below the version
// that the populatePath was added, we remove the population and just return the _id.
export function unpopulate<T>(doc: Document<T>, path: string): Document<T> {
  if (!path) {
    throw new APIError({status: 500, title: "path is required for unpopulate"});
  }
  const pathParts = path.split(".");

  // Recursive because we need to support nested paths.
  const recursiveUnpopulate = (current: any, parts: string[]): any => {
    const part = parts[0];

    // If the path doesn't exist, return the original doc
    if (!current[part]) {
      return doc;
    }

    if (parts.length === 1) {
      // Base case: we've reached the last part of the path
      if (Array.isArray(current[part])) {
        // If the field is an array, recursively unpopulate each element
        current[part] = current[part].map((item: any) => {
          return item && item._id ? item._id : item;
        });
      } else if (current[part]?._id) {
        // If the field is a populated document, revert to _id
        current[part] = current[part]._id;
      }
    } else {
      // Recursive case: continue down the path
      if (Array.isArray(current[part])) {
        current[part].forEach((item: any) => {
          recursiveUnpopulate(item, parts.slice(1)); // Recursively handle each item in the array
        });
      } else {
        recursiveUnpopulate(current[part], parts.slice(1)); // Recursively handle the next part
      }
    }

    return current;
  };

  return recursiveUnpopulate(doc, pathParts);
}
