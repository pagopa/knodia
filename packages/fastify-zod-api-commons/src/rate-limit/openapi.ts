import { type FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { rateLimitedOperationIds } from "../utils/openapi-zod-plugin/responseHeadersStore.ts";

interface RateLimitOpenapiPluginOptions {
  skip?: (routeUrl: string, method: string | string[]) => boolean;
}

// Marks every route registered in this scope as rate-limited for the OpenAPI
// spec. The actual 429 response + X-RateLimit-* / Retry-After header
// attachments are emitted by the spec transform pass
// (`utils/openapi-zod-plugin/zodToJsonSchemaTransform.ts`), which reads
// `rateLimitedOperationIds`. This plugin has no runtime side effects beyond
// the registration-time set insert.
const rateLimitOpenapiPluginAsync: FastifyPluginAsync<
  RateLimitOpenapiPluginOptions
> = async (fastify, { skip } = {}) => {
  fastify.addHook("onRoute", (routeOptions) => {
    if (skip?.(routeOptions.url, routeOptions.method)) return;
    const operationId = routeOptions.schema?.operationId;
    if (typeof operationId === "string") {
      rateLimitedOperationIds.add(operationId);
    }
  });
};

export const rateLimitOpenapiPlugin = fastifyPlugin(
  rateLimitOpenapiPluginAsync,
  { name: "rate-limit-openapi-plugin" },
);
