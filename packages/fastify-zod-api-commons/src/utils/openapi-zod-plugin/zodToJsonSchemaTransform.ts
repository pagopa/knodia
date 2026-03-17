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

import { OPENAPI_3_0_ZOD_TO_JSON_SCHEMA } from "./constants.ts";
import { responseHeadersStore } from "./responseHeadersStore.ts";

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

/**
 * Extract response headers from the input schema before the base transform runs.
 *
 * Must run before baseTransform because fastify-type-provider-zod passes unknown
 * schema fields through as-is via `...rest`, which would leak raw Zod objects.
 *
 * Supports two formats:
 * - Route-level `responseHeaders: z.object(...)` → applies to all responses
 * - Per-response `{ properties: ZodSchema, headers: z.object(...) }` → applies to that status only
 */
const extractResponseHeaders = (
  input: Parameters<typeof baseTransform>[0],
): Parameters<typeof baseTransform>[0] => {
  const { route, schema, url } = input;
  if (!schema) return input;

  const { responseHeaders, ...schemaRest } = schema;
  const rawMethod = (route as { method?: string | string[] }).method;
  const method = (
    Array.isArray(rawMethod) ? rawMethod[0] : rawMethod
  )?.toLowerCase();
  if (!method) return { ...input, schema: schemaRest };

  const routeKey = `${method}:${url}`;

  // Route-level responseHeaders → apply to all responses
  if (responseHeaders) {
    responseHeadersStore.set(
      routeKey,
      zodObjectToResponseHeaders(responseHeaders as z.ZodObject),
    );
  }

  // Per-response headers → extract from { properties, headers } entries
  const response = schemaRest.response;
  if (response) {
    for (const [statusCode, val] of Object.entries(response)) {
      if (isResponseEntryWithHeaders(val)) {
        responseHeadersStore.set(
          `${routeKey}:${statusCode}`,
          zodObjectToResponseHeaders(val.headers),
        );
      }
    }
  }

  return { ...input, schema: schemaRest };
};

export const zodToJsonSchemaTransform: typeof baseTransform = (input) =>
  baseTransform(extractResponseHeaders(input));

const ResponseEntryWithHeadersSchema = z.object({
  headers: z.instanceof(z.ZodObject),
  properties: z.unknown(),
});

function isResponseEntryWithHeaders(
  value: unknown,
): value is z.infer<typeof ResponseEntryWithHeadersSchema> {
  return ResponseEntryWithHeadersSchema.safeParse(value).success;
}
