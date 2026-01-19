import type { OpenAPIV3 } from "openapi-types";

import {
  createJsonSchemaTransform,
  createJsonSchemaTransformObject,
} from "fastify-type-provider-zod";

const OPENAPI_3_0_ZOD_TO_JSON_SCHEMA = "openapi-3.0"; // OpenAPI 3.0
const zodToJsonSchemaTransformObject = createJsonSchemaTransformObject({
  zodToJsonConfig: {
    target: OPENAPI_3_0_ZOD_TO_JSON_SCHEMA,
  },
});

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

  return openapi;
};

const updateErrorResponseContentsWithProblemJson = (
  openapi: Partial<OpenAPIV3.Document>,
): Partial<OpenAPIV3.Document> => {
  if (!openapi.paths) {
    return openapi;
  }

  for (const pathItem of Object.values(openapi.paths)) {
    if (!pathItem) continue;

    for (const operation of Object.values(pathItem)) {
      if (!operation || typeof operation !== "object") continue;
      if (!("responses" in operation) || !operation.responses) continue;

      for (const [statusCode, response] of Object.entries(
        operation.responses,
      )) {
        // Only error responses
        const numericStatus = Number(statusCode);
        if (!Number.isInteger(numericStatus) || numericStatus < 400) {
          continue;
        }

        // Skip $ref responses
        if ("$ref" in response) continue;

        const content = response.content;
        if (!content || !content["application/json"]) continue;

        response.content = {
          "application/problem+json": content["application/json"],
        };
      }
    }
  }

  return openapi;
};

export const zodToJsonSchemaTransform = createJsonSchemaTransform({
  zodToJsonConfig: {
    target: OPENAPI_3_0_ZOD_TO_JSON_SCHEMA,
  },
});

const applyOpenApiTransforms = (
  openapi: Partial<OpenAPIV3.Document>,
  transforms: ((
    d: Partial<OpenAPIV3.Document>,
  ) => Partial<OpenAPIV3.Document>)[],
): Partial<OpenAPIV3.Document> =>
  transforms.reduce((acc, transform) => transform(acc), openapi);

export const zodToJsonSchemaTransformObjectWithoutInputSchemas: typeof zodToJsonSchemaTransformObject =
  (openapi) =>
    applyOpenApiTransforms(
      zodToJsonSchemaTransformObject(openapi) as Partial<OpenAPIV3.Document>,
      [
        removeZodInputSchemasFromOpenapi,
        updateErrorResponseContentsWithProblemJson,
      ],
    );
