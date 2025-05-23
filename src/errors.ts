// https://jsonapi.org/format/#errors
import * as Sentry from "@sentry/node";
import {NextFunction, Request, Response} from "express";
import {Schema} from "mongoose";

import {logger} from "./logger";

export interface APIErrorConstructor {
  // Required. A short, human-readable summary of the problem that SHOULD NOT change from
  // occurrence to occurrence of the problem, except for purposes of localization.
  title: string;

  // error messages to be displayed by a field in a form. this isn't in the JSONAPI spec.
  // It will be folded into `meta` as `meta.fields` in the actual error payload.
  // This is helpful to add it to the TS interface for ApiError.
  fields?: {[id: string]: string};

  // A unique identifier for this particular occurrence of the problem.
  id?: string;
  // A links object containing the following members:
  links?: {about?: string; type?: string} | undefined;
  // The HTTP status code applicable to this problem. defaults to 500. must be between 400 and 599.
  status?: number;
  // An application-specific error code, expressed as a string value.
  code?: string;

  // A human-readable explanation specific to this occurrence of the problem. Like title,
  // this field’s value can be localized.
  detail?: string;
  // An object containing references to the source of the error,
  // optionally including any of the following members:
  source?: {
    // pointer: a JSON Pointer [RFC6901] to the value in the request document that caused the error
    // [e.g. "/data" for a primary data object, or "/data/attributes/title" for a specific
    // attribute]. This MUST point to a value in the request document that exists; if it doesn’t,
    // the client SHOULD simply ignore the pointer.
    pointer?: string;
    // a string indicating which URI query parameter caused the error.
    parameter?: string;
    // a string indicating the name of a single request header which caused the error.
    header?: string;
  };
  // A meta object containing non-standard meta-information about the error.
  meta?: {[id: string]: string};
  error?: Error;
  // If true, this error will not be sent to external error reporting tools like Sentry.
  disableExternalErrorTracking?: boolean;
}

/**
 * APIError is a simple way to throw an error in an API route and control what is shown and the
 * HTTP code displayed. It follows the JSONAPI spec to standardize the fields,
 * allowing the UI to show more consistent, better error messages.
 *
 * ```ts
 *  throw new APIError({
 *    title: "Only an admin can update that!",
 *    status: 403,
 *    code: "update-admin-error",
 *    detail: "You must be an admin to change that field"
 *  });
 * ```
 */
export class APIError extends Error {
  title: string;

  id: string | undefined;

  links: {about?: string; type?: string} | undefined;

  status: number;

  code: string | undefined;

  detail: string | undefined;

  source:
    | {
        pointer?: string;
        parameter?: string;
        header?: string;
      }
    | undefined;

  meta: {[id: string]: any} | undefined;

  error?: Error;

  disableExternalErrorTracking?: boolean;

  constructor(data: APIErrorConstructor) {
    // Include details in when the error is printed to the console or sent to Sentry.
    super(
      `${data.title}${data.detail ? `: ${data.detail}` : ""}${
        data.error ? `\n${data.error.stack}` : ""
      }`
    );
    this.name = "APIError";

    // eslint-disable-next-line prefer-const
    let {title, id, links, status, code, detail, source, meta, fields, error} = data;

    if (!status) {
      status = 500;
    } else if (status && (status < 400 || status > 599)) {
      logger.error(`Invalid ApiError status code: ${status}, using 500`);
      status = 500;
    }
    this.status = status;

    this.title = title;
    this.id = id;
    this.links = links;

    this.code = code;
    this.detail = detail;
    this.source = source;
    this.meta = meta ?? {};
    this.disableExternalErrorTracking = data.disableExternalErrorTracking;
    if (fields) {
      this.meta.fields = fields;
    }
    this.error = error;
    logger.error(
      `APIError(${status}): ${title} ${detail ? detail : ""}${
        data.error?.stack ? `\n${data.error?.stack}` : ""
      }`
    );
  }
}

// This can be attached to any schema to store errors compatible with the JSONAPI spec.
export const ErrorSchema = new Schema({
  title: {type: String, required: true},
  id: String,
  links: {
    about: String,
    type: String,
  },
  status: Number,
  code: String,
  detail: String,
  source: {
    pointer: String,
    parameter: String,
    header: String,
  },
  meta: Schema.Types.Mixed,
});

// Create an errors field for storing error information in a JSONAPI compatible form directly on a
// model.
export function errorsPlugin(schema: Schema): void {
  schema.add({apiErrors: [ErrorSchema]});
}

export function isAPIError(error: Error): error is APIError {
  return error.name === "APIError";
}

// Creates an APIError body to send to clients as JSON. Errors don't have a toJSON defined,
// and we want to strip out things like message, name, and stack for the client.
// There is almost certainly a more elegant solution to this.
export function getAPIErrorBody(error: APIError): {[id: string]: any} {
  const errorData = {status: error.status, title: error.title};
  for (const key of [
    "id",
    "links",
    "status",
    "code",
    "detail",
    "source",
    "meta",
    "disableExternalErrorTracking",
  ]) {
    if (error[key]) {
      errorData[key] = error[key];
    }
  }
  return errorData;
}

export function apiUnauthorizedMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err.message === "Unauthorized") {
    // not using the actual APIError class here because we don't want to log it as an error.
    res.status(401).json({status: 401, title: "Unauthorized"}).send();
  } else {
    next(err);
  }
}

export function apiErrorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (isAPIError(err)) {
    if (!err.disableExternalErrorTracking) {
      Sentry.captureException(err);
    }
    res.status(err.status).json(getAPIErrorBody(err)).send();
  } else {
    next(err);
  }
}
