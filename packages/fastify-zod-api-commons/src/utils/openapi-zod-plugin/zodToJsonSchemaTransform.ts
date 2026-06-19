/*
 * Per-route transform (`transform` in @fastify/swagger config).
 *
 * Runs once for each registered route. It receives {schema, url} and
 * converts Zod schemas to JSON Schema before @fastify/swagger turns
 * them into OpenAPI parameters, request bodies, and responses.
 *
 * We wrap the base jsonSchemaTransform from fastify-type-provider-zod
 * to apply additional transformations on top.
 */

import type { OpenAPIV3 } from "openapi-types";

import { createJsonSchemaTransform } from "fastify-type-provider-zod";
import z from "zod";

import { RATE_LIMIT_HEADERS } from "../../rate-limit/headers.ts";
import { OPENAPI_3_0_ZOD_TO_JSON_SCHEMA } from "./constants.ts";
import {
  responseHeadersStore,
  sharedHeaderComponentsStore,
} from "./responseHeadersStore.ts";

declare module "fastify" {
  interface FastifySchema {
    responseHeaders?: unknown;
  }
}

const baseTransform = createJsonSchemaTransform({
  zodToJsonConfig: {
    target: OPENAPI_3_0_ZOD_TO_JSON_SCHEMA,
  },
});

const zodObjectToResponseHeaders = (
  zodSchema: z.ZodObject<Record<string, z.ZodTypeAny>>,
): Record<string, OpenAPIV3.HeaderObject> =>
  Object.fromEntries(
    Object.entries(zodSchema.shape).map(([name, propSchema]) => {
      const { description, ...schema } = z.toJSONSchema(propSchema, {
        target: OPENAPI_3_0_ZOD_TO_JSON_SCHEMA,
      });

      return [
        name,
        {
          // If parsing undefined fails, it's required
          required: !propSchema.safeParse(undefined).success,
          schema: schema as OpenAPIV3.SchemaObject,
          ...(typeof description === "string" ? { description } : {}),
        },
      ];
    }),
  );

type TransformInput = Parameters<typeof baseTransform>[0];
type TransformStep = (input: TransformInput) => TransformInput;

const isDocsRoute = ({ route }: TransformInput): boolean =>
  route.url.startsWith("/docs/");

const enforceOperationId = (input: TransformInput): TransformInput => {
  if (!isDocsRoute(input)) {
    const { route, schema } = input;
    if (!schema.operationId) {
      throw new Error(
        `Missing operationId in schema for route ${route.method} ${route.url}.`,
      );
    }
  }

  return input;
};

const enforceSummary = (input: TransformInput): TransformInput => {
  if (!isDocsRoute(input)) {
    const { route, schema } = input;
    if (!schema.summary) {
      throw new Error(
        `Missing summary in schema for route ${route.method} ${route.url}.`,
      );
    }
  }

  return input;
};

const enforceDescription = (input: TransformInput): TransformInput => {
  if (!isDocsRoute(input)) {
    const { route, schema } = input;
    if (!schema.description) {
      throw new Error(
        `Missing description in schema for route ${route.method} ${route.url}.`,
      );
    }
  }

  return input;
};

/**
 * Extract response headers from the input schema before the base transform runs.
 *
 * Must run before baseTransform because fastify-type-provider-zod passes unknown
 * schema fields through as-is via `...rest`, which would leak raw Zod objects.
 *
 * Supports two formats:
 * - Route-level `responseHeaders: z.object(...)` → applies to all responses
 * - Per-response `{ properties: ZodSchema, headers: z.object(...) }` → applies to that status only
 *
 * Merges with any entry already in `responseHeadersStore`.
 */
const extractResponseHeaders = (input: TransformInput): TransformInput => {
  const { responseHeaders, ...schemaRest } = input.schema;
  const operationId = input.schema.operationId;

  if (!operationId) return input;

  // Route-level responseHeaders → apply to all responses
  if (responseHeaders instanceof z.ZodObject) {
    responseHeadersStore.set(operationId, {
      ...responseHeadersStore.get(operationId),
      ...zodObjectToResponseHeaders(responseHeaders),
    });
  }

  // Per-response headers → extract from { properties, headers } entries
  const response = schemaRest.response;
  if (response) {
    for (const [statusCode, val] of Object.entries(response)) {
      if (isResponseEntryWithHeaders(val)) {
        responseHeadersStore.set(`${operationId}:${statusCode}`, {
          ...responseHeadersStore.get(`${operationId}:${statusCode}`),
          ...zodObjectToResponseHeaders(val.headers),
        });
      }
    }
  }

  return { ...input, schema: schemaRest };
};

const TOO_MANY_REQUESTS_STATUS = "429";

const int32HeaderComponent = (description: string): OpenAPIV3.HeaderObject => ({
  description,
  // `required: false` because earlier-lifecycle 4xx (401/403) responses won't
  // reach the rate-limit hook and thus won't carry these headers.
  required: false,
  schema: {
    format: "int32",
    minimum: 0,
    type: "integer",
  },
});

const RATE_LIMIT_HEADER_COMPONENTS: Record<string, OpenAPIV3.HeaderObject> = {
  [RATE_LIMIT_HEADERS.limit.openapiComponentName]: int32HeaderComponent(
    "Total requests allowed in the current window.",
  ),
  [RATE_LIMIT_HEADERS.remaining.openapiComponentName]: int32HeaderComponent(
    "Requests remaining in the current window.",
  ),
  [RATE_LIMIT_HEADERS.reset.openapiComponentName]: int32HeaderComponent(
    "Seconds before the current window resets.",
  ),
  [RATE_LIMIT_HEADERS.retryAfter.openapiComponentName]: int32HeaderComponent(
    "Seconds the client should wait before retrying.",
  ),
};

// X-RateLimit-* are informational: the runtime headers plugin emits them on
// every response that reaches it, so we attach them at route level.
const INFORMATIONAL_RATE_LIMIT_HEADERS = [
  RATE_LIMIT_HEADERS.limit,
  RATE_LIMIT_HEADERS.remaining,
  RATE_LIMIT_HEADERS.reset,
] as const;

// Retry-After is prescriptive (RFC 9110 §10.2.3) and the runtime plugin only
// sets it on 429, so we attach it to the 429 response only.
const RETRY_AFTER_RATE_LIMIT_HEADER = RATE_LIMIT_HEADERS.retryAfter;

// Fresh record per route — js-yaml would otherwise collapse a shared
// reference into anchor/alias notation in the generated spec.
const buildRateLimitHeaderRefs = (
  headers: readonly { openapiComponentName: string; openapiName: string }[],
): Record<string, OpenAPIV3.ReferenceObject> =>
  Object.fromEntries(
    headers.map((h) => [
      h.openapiName,
      { $ref: `#/components/headers/${h.openapiComponentName}` },
    ]),
  );

/**
 * Attach rate-limit header refs to routes that declare a 429 response.
 *
 * Side effects (lazy, transform-time only):
 *  - `responseHeadersStore[operationId]`         += X-RateLimit-* refs
 *  - `responseHeadersStore[operationId:429]`     += Retry-After ref
 *  - `sharedHeaderComponentsStore[...]`          += rate-limit header components
 */
const attachRateLimitHeaders = (input: TransformInput): TransformInput => {
  const operationId = input.schema.operationId;
  if (!operationId) return input;

  const response = input.schema.response as Record<string, unknown> | undefined;
  if (!response || !(TOO_MANY_REQUESTS_STATUS in response)) return input;

  responseHeadersStore.set(operationId, {
    ...responseHeadersStore.get(operationId),
    ...buildRateLimitHeaderRefs(INFORMATIONAL_RATE_LIMIT_HEADERS),
  });

  const tooManyRequestsKey = `${operationId}:${TOO_MANY_REQUESTS_STATUS}`;
  responseHeadersStore.set(tooManyRequestsKey, {
    ...responseHeadersStore.get(tooManyRequestsKey),
    ...buildRateLimitHeaderRefs([RETRY_AFTER_RATE_LIMIT_HEADER]),
  });

  for (const [name, header] of Object.entries(RATE_LIMIT_HEADER_COMPONENTS)) {
    sharedHeaderComponentsStore.set(name, header);
  }

  return input;
};

/**
 * Convert `cookies` Zod schemas into JSON Schema so that @fastify/swagger
 * can generate OpenAPI cookie parameters.
 *
 * fastify-type-provider-zod only handles body, querystring, headers, params;
 * cookies are passed through as raw Zod objects, which @fastify/swagger
 * cannot resolve.
 */
const convertCookiesZodToJsonSchema = (
  input: TransformInput,
): TransformInput => {
  const schema = input.schema as Record<string, unknown> | undefined;
  if (schema?.["cookies"]) {
    schema["cookies"] = z.toJSONSchema(schema["cookies"] as z.ZodType, {
      target: OPENAPI_3_0_ZOD_TO_JSON_SCHEMA,
    });
  }
  return input;
};

const applyTransformSteps = (
  input: TransformInput,
  steps: TransformStep[],
): TransformInput => steps.reduce((acc, step) => step(acc), input);

export const zodToJsonSchemaTransform: typeof baseTransform = (input) =>
  baseTransform(
    applyTransformSteps(input, [
      enforceOperationId,
      enforceSummary,
      enforceDescription,
      extractResponseHeaders,
      attachRateLimitHeaders,
      convertCookiesZodToJsonSchema,
    ]),
  );

const ResponseEntryWithHeadersSchema = z.object({
  headers: z.instanceof(z.ZodObject),
  properties: z.unknown(),
});

function isResponseEntryWithHeaders(
  value: unknown,
): value is z.infer<typeof ResponseEntryWithHeadersSchema> {
  return ResponseEntryWithHeadersSchema.safeParse(value).success;
}
