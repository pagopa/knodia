import {
  createJsonSchemaTransform,
  createJsonSchemaTransformObject,
} from "fastify-type-provider-zod";

const zodToJsonConfigTarget = "draft-2020-12"; // OpenAPI 3.1
const zodToJsonSchemaTransformObject = createJsonSchemaTransformObject({
  zodToJsonConfig: {
    target: zodToJsonConfigTarget,
  },
});

/**
 * Remove all schemas ending with "Input" from the generated OpenAPI spec.
 * This is a workaround, waiting for a proper solution in fastify-type-provider-zod.
 * See: https://github.com/turkerdev/fastify-type-provider-zod/issues/214
 */
const removeZodInputSchemasFromOpenapi = (
  openapi: ReturnType<typeof zodToJsonSchemaTransformObject> & {
    components?: { schemas?: Record<string, unknown> };
  }
): ReturnType<typeof zodToJsonSchemaTransformObject> => {
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
    target: zodToJsonConfigTarget,
  },
});

export const zodToJsonSchemaTransformObjectWithoutInputSchemas: typeof zodToJsonSchemaTransformObject =
  (openapi) =>
    removeZodInputSchemasFromOpenapi(zodToJsonSchemaTransformObject(openapi));
