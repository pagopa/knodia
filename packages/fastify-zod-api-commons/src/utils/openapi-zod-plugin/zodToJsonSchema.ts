import type { OpenAPIV3 } from "openapi-types";

import {
  createJsonSchemaTransform,
  createJsonSchemaTransformObject,
} from "fastify-type-provider-zod";

import { healthRouterTag } from "../../routers/healthRouter.ts";
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
        // Ignore non-error responses except for health endpoints
        const responseStatusCode = Number(statusCode);
        if (
          !Number.isInteger(responseStatusCode) ||
          (responseStatusCode < 400 &&
            !operation.tags?.includes(healthRouterTag.name))
        ) {
          continue;
        }

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

/**
 * Mark all request bodies as required in the generated OpenAPI spec.
 * This is a workaround because fastify-swagger does not set `required: true`
 * on request bodies by default when a body schema is defined.
 * See: https://github.com/fastify/fastify-swagger/issues/894
 */
const markRequestBodiesAsRequired = (
  openapi: Partial<OpenAPIV3.Document>,
): Partial<OpenAPIV3.Document> => {
  if (!openapi.paths) {
    return openapi;
  }

  for (const pathItem of Object.values(openapi.paths)) {
    if (!pathItem) continue;

    for (const operation of Object.values(pathItem)) {
      if (!operation || typeof operation !== "object") continue;
      if (!("requestBody" in operation) || !operation.requestBody) continue;
      if ("$ref" in operation.requestBody) continue;

      operation.requestBody.required = true;
    }
  }

  return openapi;
};

export const removeUnusedComponents = (
  openapi: Partial<OpenAPIV3.Document>,
): Partial<OpenAPIV3.Document> => {
  if (!openapi.components?.schemas || !openapi.paths) return openapi;

  const refs = new Set<string>();

  const collectRefs = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(collectRefs);
    if (!value || typeof value !== "object") return;

    for (const [k, v] of Object.entries(value)) {
      if (k === "$ref" && typeof v === "string") {
        const match = v.match(/^#\/components\/schemas\/(.+)$/);
        if (match && match[1] && !refs.has(match[1])) {
          refs.add(match[1]);
          // also follow this schema recursively
          const component = openapi.components?.schemas?.[match[1]];
          if (component) collectRefs(component);
        }
      } else {
        collectRefs(v);
      }
    }
  };

  collectRefs(openapi.paths);

  for (const key of Object.keys(openapi.components.schemas)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (!refs.has(key)) delete openapi.components.schemas[key];
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

export const cleanOpenapi: typeof zodToJsonSchemaTransformObject = (openapi) =>
  applyOpenApiTransforms(
    zodToJsonSchemaTransformObject(openapi) as Partial<OpenAPIV3.Document>,
    [
      removeZodInputSchemasFromOpenapi,
      updateErrorResponseContentsWithProblemJson,
      markRequestBodiesAsRequired,
      removeUnusedComponents,
    ],
  );
