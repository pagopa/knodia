import type { OpenAPIV3 } from "openapi-types";

/**
 * Module-level store for response headers shared between the per-route
 * and document-level transforms.
 *
 * Keys are `operationId` (route-level) or `operationId:statusCode` (per-response).
 */
export const responseHeadersStore = new Map<
  string,
  Record<string, OpenAPIV3.HeaderObject>
>();
