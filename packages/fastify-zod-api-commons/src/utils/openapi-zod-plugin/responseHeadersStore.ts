import type { OpenAPIV3 } from "openapi-types";

// Keys: `operationId` (route-level) or `operationId:statusCode` (per-response).
export const responseHeadersStore = new Map<
  string,
  Record<string, OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject>
>();

// Headers hoisted under `components.headers` and referenced via `$ref` from
// responses, so widely-shared headers (e.g. rate-limit) don't bloat the spec.
export const sharedHeaderComponentsStore = new Map<
  string,
  OpenAPIV3.HeaderObject
>();
