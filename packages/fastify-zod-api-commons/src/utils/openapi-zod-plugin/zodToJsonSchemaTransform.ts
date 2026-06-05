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

type TransformInput = Parameters<typeof baseTransform>[0];
type TransformStep = (input: TransformInput) => TransformInput;

const shouldSkipOperationIdCheck = ({ route }: TransformInput): boolean =>
  route.url.startsWith("/docs/");

const enforceOperationId = (input: TransformInput): TransformInput => {
  if (!shouldSkipOperationIdCheck(input)) {
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
  if (!shouldSkipOperationIdCheck(input)) {
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
  if (!shouldSkipOperationIdCheck(input)) {
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
 */
const extractResponseHeaders = (input: TransformInput): TransformInput => {
  const { responseHeaders, ...schemaRest } = input.schema;
  const operationId = input.schema.operationId;

  if (!operationId) return input;

  // Route-level responseHeaders → apply to all responses
  if (responseHeaders) {
    responseHeadersStore.set(
      operationId,
      zodObjectToResponseHeaders(responseHeaders as z.ZodObject),
    );
  }

  // Per-response headers → extract from { properties, headers } entries
  const response = schemaRest.response;
  if (response) {
    for (const [statusCode, val] of Object.entries(response)) {
      if (isResponseEntryWithHeaders(val)) {
        responseHeadersStore.set(
          `${operationId}:${statusCode}`,
          zodObjectToResponseHeaders(val.headers),
        );
      }
    }
  }

  return { ...input, schema: schemaRest };
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
