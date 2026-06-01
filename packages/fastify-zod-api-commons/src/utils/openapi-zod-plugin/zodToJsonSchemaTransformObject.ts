/*
 * Document-level transform (`transformObject` in @fastify/swagger config).
 *
 * Runs once after all routes have been processed.
 *
 * We wrap the base jsonSchemaTransformObject from fastify-type-provider-zod
 * to apply additional transformations on top.
 */

import type { OpenAPIV3 } from "openapi-types";

import { createJsonSchemaTransformObject } from "fastify-type-provider-zod";

import { healthRouterTag } from "../../routers/healthRouter.ts";
import { OPENAPI_3_0_ZOD_TO_JSON_SCHEMA } from "./constants.ts";
import {
  responseHeadersStore,
  sharedHeaderComponentsStore,
} from "./responseHeadersStore.ts";

const baseTransformObject = createJsonSchemaTransformObject({
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

        if (!content) continue;

        const responseSchema = Object.values(content).at(0);
        if (!responseSchema) continue;

        response.content = {
          "application/problem+json": responseSchema,
        };
      }
    }
  }

  return openapi;
};

// Prune unreferenced schema and header components. Headers matter for the
// multi-spec case: `sharedHeaderComponentsStore` is process-global, so a
// spec generated alongside others can end up with rate-limit header
// components it never uses — drop those so each spec only carries its own.
const removeUnusedComponents = (
  openapi: Partial<OpenAPIV3.Document>,
): Partial<OpenAPIV3.Document> => {
  if (!openapi.components || !openapi.paths) return openapi;

  const { headers, schemas } = openapi.components;
  if (!schemas && !headers) return openapi;

  const usedSchemas = new Set<string>();
  const usedHeaders = new Set<string>();

  const collectRefs = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(collectRefs);
    if (!value || typeof value !== "object") return;

    for (const [k, v] of Object.entries(value)) {
      if (k === "$ref" && typeof v === "string") {
        const schemaName = v.match(/^#\/components\/schemas\/(.+)$/)?.[1];
        if (schemaName && !usedSchemas.has(schemaName)) {
          usedSchemas.add(schemaName);
          collectRefs(schemas?.[schemaName]);
        }
        const headerName = v.match(/^#\/components\/headers\/(.+)$/)?.[1];
        if (headerName && !usedHeaders.has(headerName)) {
          usedHeaders.add(headerName);
          collectRefs(headers?.[headerName]);
        }
      } else {
        collectRefs(v);
      }
    }
  };

  collectRefs(openapi.paths);

  if (schemas) {
    openapi.components.schemas = Object.fromEntries(
      Object.entries(schemas).filter(([key]) => usedSchemas.has(key)),
    );
  }

  if (headers) {
    openapi.components.headers = Object.fromEntries(
      Object.entries(headers).filter(([key]) => usedHeaders.has(key)),
    );
  }

  return openapi;
};

// Deep-clone so each response holds its own copy — sharing a reference would
// make js-yaml emit anchor/alias notation in the generated spec.
const cloneHeaderRecord = (
  src:
    | Record<string, OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject>
    | undefined,
):
  | Record<string, OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject>
  | undefined =>
  src &&
  Object.fromEntries(
    Object.entries(src).map(([k, v]) => [k, structuredClone(v)]),
  );

const addResponseHeadersToOpenapi = (
  openapi: Partial<OpenAPIV3.Document>,
): Partial<OpenAPIV3.Document> => {
  if (!openapi.paths || responseHeadersStore.size === 0) return openapi;

  for (const pathItem of Object.values(openapi.paths)) {
    if (!pathItem) continue;

    for (const operation of Object.values(pathItem)) {
      if (!operation || typeof operation !== "object") continue;
      if (!("operationId" in operation) || !operation.operationId) continue;
      if (!("responses" in operation) || !operation.responses) continue;

      const routeKey = operation.operationId as string;
      const routeHeaders = responseHeadersStore.get(routeKey);

      for (const [statusCode, response] of Object.entries(
        operation.responses,
      )) {
        if ("$ref" in response) continue;

        const perResponseHeaders = responseHeadersStore.get(
          `${routeKey}:${statusCode}`,
        );

        if (routeHeaders || perResponseHeaders) {
          response.headers = {
            ...response.headers,
            ...cloneHeaderRecord(routeHeaders),
            ...cloneHeaderRecord(perResponseHeaders),
          };
        }
      }
    }
  }

  // Don't clear: @fastify/swagger caches JSON and YAML separately, so this
  // document transform runs twice per spec, while the per-route transform
  // (`extractResponseHeaders` + `attachRateLimitHeaders` in
  // zodToJsonSchemaTransform.ts) fills `responseHeadersStore` once during
  // `app.ready()`. Clearing here would dangle every `$ref` on the second
  // format pass. Entries are keyed by `operationId`, so specs generated in
  // the same process only pick up their own routes' headers.
  return openapi;
};

const addSharedHeaderComponents = (
  openapi: Partial<OpenAPIV3.Document>,
): Partial<OpenAPIV3.Document> => {
  if (sharedHeaderComponentsStore.size === 0) return openapi;

  openapi.components = openapi.components ?? {};
  openapi.components.headers = {
    ...openapi.components.headers,
    ...Object.fromEntries(sharedHeaderComponentsStore.entries()),
  };

  // Don't clear: the per-route transform fills this store during
  // `app.ready()`, and @fastify/swagger runs this transform on each format
  // call — clearing would dangle every `$ref` on the second pass. The store
  // is process-global, so a spec may receive components for headers it never
  // references (another spec generated in the same process registered them);
  // `removeUnusedComponents` prunes those.
  return openapi;
};

const applyOpenApiTransforms = (
  openapi: Partial<OpenAPIV3.Document>,
  transforms: ((
    d: Partial<OpenAPIV3.Document>,
  ) => Partial<OpenAPIV3.Document>)[],
): Partial<OpenAPIV3.Document> =>
  transforms.reduce((acc, transform) => transform(acc), openapi);

export const zodToJsonSchemaTransformObject: typeof baseTransformObject = (
  openapi,
) =>
  applyOpenApiTransforms(
    baseTransformObject(openapi) as Partial<OpenAPIV3.Document>,
    [
      removeZodInputSchemasFromOpenapi,
      updateErrorResponseContentsWithProblemJson,
      addResponseHeadersToOpenapi,
      addSharedHeaderComponents,
      removeUnusedComponents,
    ],
  );
