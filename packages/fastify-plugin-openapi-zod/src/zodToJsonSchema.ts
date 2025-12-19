import {
  createJsonSchemaTransform,
  createJsonSchemaTransformObject,
} from "fastify-type-provider-zod";
import type { OpenAPIV3_1 } from "openapi-types";

const OPENAPI_3_1_ZOD_TO_JSON_SCHEMA = "draft-2020-12"; // OpenAPI 3.1
const zodToJsonSchemaTransformObject = createJsonSchemaTransformObject({
  zodToJsonConfig: {
    target: OPENAPI_3_1_ZOD_TO_JSON_SCHEMA,
  },
});

/**
 * Remove all schemas ending with "Input" from the generated OpenAPI spec.
 * This is a workaround, waiting for a proper solution in fastify-type-provider-zod.
 * See: https://github.com/turkerdev/fastify-type-provider-zod/issues/214
 *
 * TODO: consider using spectral lint to autofix the removal of unused schemas
 * instead of this workaround.
 */
const removeZodInputSchemasFromOpenapi = (
  openapi: Partial<OpenAPIV3_1.Document>
): Partial<OpenAPIV3_1.Document> => {
  if (openapi.components && openapi.components.schemas) {
    const inputKeysToDelete = Object.keys(openapi.components.schemas).filter(
      (key) => key.endsWith("Input")
    );
    for (const key of inputKeysToDelete) {
      delete openapi.components.schemas[key];
    }
  }

  return openapi;
};

export const zodToJsonSchemaTransform = createJsonSchemaTransform({
  zodToJsonConfig: {
    target: OPENAPI_3_1_ZOD_TO_JSON_SCHEMA,
  },
});

export const zodToJsonSchemaTransformObjectWithoutInputSchemas: typeof zodToJsonSchemaTransformObject =
  (openapi) =>
    removeZodInputSchemasFromOpenapi(
      zodToJsonSchemaTransformObject(openapi) as Partial<OpenAPIV3_1.Document>
    );
