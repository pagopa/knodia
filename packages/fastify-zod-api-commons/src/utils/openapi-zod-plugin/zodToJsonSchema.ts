import type { OpenAPIV3 } from "openapi-types";

import {
  createJsonSchemaTransform,
  createJsonSchemaTransformObject,
} from "fastify-type-provider-zod";

import { OPENAPI_3_0_ZOD_TO_JSON_SCHEMA } from "./constants.ts";

const zodToJsonSchemaTransformObject = createJsonSchemaTransformObject({
  zodToJsonConfig: {
    target: OPENAPI_3_0_ZOD_TO_JSON_SCHEMA,
  },
});

const replaceInputRefs = (value: unknown): void => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      replaceInputRefs(entry);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  for (const [key, entry] of Object.entries(record)) {
    if (
      key === "$ref" &&
      typeof entry === "string" &&
      entry.includes("#/components/schemas/") &&
      entry.endsWith("Input")
    ) {
      record[key] = entry.replace(/Input$/, "");
      continue;
    }

    replaceInputRefs(entry);
  }
};

/**
 * Remove all schemas ending with "Input" from the generated OpenAPI spec.
 * This is a workaround, waiting for a proper solution in fastify-type-provider-zod.
 * See: https://github.com/turkerdev/fastify-type-provider-zod/issues/214
 */
const removeZodInputSchemasFromOpenapi = (
  openapi: Partial<OpenAPIV3.Document>,
): Partial<OpenAPIV3.Document> => {
  if (openapi.components && openapi.components.schemas) {
    const inputKeysToDelete = Object.keys(openapi.components.schemas).filter(
      (key) => key.endsWith("Input"),
    );
    for (const key of inputKeysToDelete) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete openapi.components.schemas[key];
    }
  }

  replaceInputRefs(openapi);

  return openapi;
};

export const zodToJsonSchemaTransform = createJsonSchemaTransform({
  zodToJsonConfig: {
    target: OPENAPI_3_0_ZOD_TO_JSON_SCHEMA,
  },
});

export const zodToJsonSchemaTransformObjectWithoutInputSchemas: typeof zodToJsonSchemaTransformObject =
  (openapi) =>
    removeZodInputSchemasFromOpenapi(
      zodToJsonSchemaTransformObject(openapi) as Partial<OpenAPIV3.Document>,
    );
