import { type FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { API_Problem } from "../models/api.ts";

const TOO_MANY_REQUESTS_STATUS = "429";

const TOO_MANY_REQUESTS = API_Problem.meta({
  description: "Too Many Requests",
});

interface RateLimitOpenapiDocsOptions {
  skip?: (routeUrl: string, method: string | string[]) => boolean;
}

// Declares the 429 response on every route in the scope where it's
// registered, so (a) Fastify accepts the API_Problem body emitted by
// `enforceRateLimit` against the route schema, and (b) @fastify/swagger
// picks 429 up for the generated OpenAPI spec.
//
// The X-RateLimit-* + Retry-After header attachments and the shared header
// components are emitted by the spec transform pass (see
// `attachRateLimitHeaders` in `utils/openapi-zod-plugin/zodToJsonSchemaTransform.ts`).
// We keep the schema mutation here at registration time because Fastify
// reads it for runtime validation; the header / component attachments are
// pure documentation, so they live in the transform.
const rateLimitOpenapiDocsPlugin: FastifyPluginAsync<
  RateLimitOpenapiDocsOptions
> = async (fastify, { skip } = {}) => {
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
  });
};

export const rateLimitOpenapiDocs = fastifyPlugin(rateLimitOpenapiDocsPlugin, {
  name: "rate-limit-openapi-docs",
});
