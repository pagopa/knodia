import type { OpenAPIV3 } from "openapi-types";

import { type FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { API_Problem } from "../models/api.ts";
import {
  responseHeadersStore,
  sharedHeaderComponentsStore,
} from "../utils/openapi-zod-plugin/responseHeadersStore.ts";
import { RATE_LIMIT_HEADERS } from "./headers.ts";

// `required: false` because earlier-lifecycle 4xx (401/403) responses won't
// reach the rate-limit hook and thus won't carry these headers.
const int32HeaderComponent = (description: string): OpenAPIV3.HeaderObject => ({
  description,
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

// X-RateLimit-* are informational: the runtime hook emits them on every
// response that reaches it, so we attach them route-level.
const INFORMATIONAL_HEADERS = [
  RATE_LIMIT_HEADERS.limit,
  RATE_LIMIT_HEADERS.remaining,
  RATE_LIMIT_HEADERS.reset,
] as const;

// Retry-After is prescriptive (RFC 9110 §10.2.3) and the runtime hook only
// sets it on 429, so we attach it to the 429 response only.
const RETRY_AFTER_HEADER = RATE_LIMIT_HEADERS.retryAfter;

const TOO_MANY_REQUESTS_STATUS = "429";

const TOO_MANY_REQUESTS = API_Problem.meta({
  description: "Too Many Requests",
});

interface RateLimitOpenapiDocsOptions {
  skip?: (routeUrl: string, method: string | string[]) => boolean;
}

const rateLimitOpenapiDocsPlugin: FastifyPluginAsync<
  RateLimitOpenapiDocsOptions
> = async (fastify, { skip } = {}) => {
  for (const [name, header] of Object.entries(RATE_LIMIT_HEADER_COMPONENTS)) {
    sharedHeaderComponentsStore.set(name, header);
  }

  fastify.addHook("onRoute", (routeOptions) => {
    if (skip?.(routeOptions.url, routeOptions.method)) {
      return;
    }

    const schema = (routeOptions.schema ??= {});
    const response = (schema.response ?? {}) as Record<string, unknown>;
    schema.response = response;

    if (!(TOO_MANY_REQUESTS_STATUS in response)) {
      response[TOO_MANY_REQUESTS_STATUS] = TOO_MANY_REQUESTS;
    }

    const { operationId } = schema;
    if (!operationId) return;

    // Merge into existing entries (route-level Zod `responseHeaders` may
    // also contribute) so both layers coexist on the same response.
    responseHeadersStore.set(operationId, {
      ...responseHeadersStore.get(operationId),
      ...buildRateLimitHeaderRefs(INFORMATIONAL_HEADERS),
    });

    const tooManyRequestsKey = `${operationId}:${TOO_MANY_REQUESTS_STATUS}`;
    responseHeadersStore.set(tooManyRequestsKey, {
      ...responseHeadersStore.get(tooManyRequestsKey),
      ...buildRateLimitHeaderRefs([RETRY_AFTER_HEADER]),
    });
  });
};

export const rateLimitOpenapiDocs = fastifyPlugin(rateLimitOpenapiDocsPlugin, {
  name: "rate-limit-openapi-docs",
});
