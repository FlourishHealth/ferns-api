import crypto from "crypto";
import {NextFunction, Request, Response} from "express";

/**
 * Middleware to add ETag support for OpenAPI JSON endpoint.
 * This middleware should be added before the @wesleytodd/openapi middleware
 * to intercept requests to /openapi.json and add conditional request support.
 */
export function openApiEtagMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only handle GET requests to /openapi.json
  if (req.method !== "GET" || req.path !== "/openapi.json") {
    next();
    return;
  }

  // Store original res.json to intercept the response
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    // Generate ETag based on the JSON content
    const jsonString = JSON.stringify(body);
    const etag = `"${crypto.createHash("sha256").update(jsonString).digest("hex").substring(0, 16)}"`;

    // Set ETag header
    res.set("ETag", etag);

    // Check If-None-Match header for conditional requests
    const ifNoneMatch = req.get("If-None-Match");
    if (ifNoneMatch === etag) {
      // Resource hasn't changed, return 304 Not Modified
      res.status(304).end();
      return res;
    }

    // Resource has changed or no conditional header, return the content
    return originalJson(body);
  };

  next();
}
