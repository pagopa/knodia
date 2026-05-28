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

// Populated at route-registration time by `rateLimitOpenapiPlugin`. Read at
// spec-transform time to inject the 429 response (+ X-RateLimit-*/Retry-After
// headers) on every route in a rate-limited scope. Decouples the runtime
// rate-limit wiring from the spec-generation logic that documents it.
export const rateLimitedOperationIds = new Set<string>();
