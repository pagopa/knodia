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

import { createJsonSchemaTransform } from "fastify-type-provider-zod";
import z, { toJSONSchema } from "zod";

import { OPENAPI_3_0_ZOD_TO_JSON_SCHEMA } from "./constants.ts";

const baseTransform = createJsonSchemaTransform({
  zodToJsonConfig: {
    target: OPENAPI_3_0_ZOD_TO_JSON_SCHEMA,
  },
});

/**
 * Convert `cookies` Zod schemas into JSON Schema so that @fastify/swagger
 * can generate OpenAPI cookie parameters.
 *
 * fastify-type-provider-zod only handles body, querystring, headers, params;
 * cookies are passed through as raw Zod objects, which @fastify/swagger
 * cannot resolve.
 */
const convertCookiesZodToJsonSchema = (
  result: ReturnType<typeof baseTransform>,
): ReturnType<typeof baseTransform> => {
  const schema = result.schema as Record<string, unknown> | undefined;
  if (schema?.["cookies"]) {
    schema["cookies"] = toJSONSchema(schema["cookies"] as z.ZodType, {
      target: OPENAPI_3_0_ZOD_TO_JSON_SCHEMA,
    });
  }
  return result;
};

const applyRouteTransforms = (
  result: ReturnType<typeof baseTransform>,
  transforms: ((
    r: ReturnType<typeof baseTransform>,
  ) => ReturnType<typeof baseTransform>)[],
): ReturnType<typeof baseTransform> =>
  transforms.reduce((acc, transform) => transform(acc), result);

export const zodToJsonSchemaTransform: typeof baseTransform = (input) =>
  applyRouteTransforms(baseTransform(input), [convertCookiesZodToJsonSchema]);
