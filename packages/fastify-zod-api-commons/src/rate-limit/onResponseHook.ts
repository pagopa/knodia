import { requestContext } from "@fastify/request-context";
import { type FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { RATE_LIMIT_HEADERS } from "./headers.ts";

// Operational signal: emitted only in fail-open mode, for dashboards/alerts.
// Not part of the public client contract.
const DEGRADED_HEADER = "x-ratelimit-degraded";

export const rateLimitResponseHeadersHook: FastifyPluginAsync = fastifyPlugin(
  async (fastify) => {
    fastify.addHook("onSend", async (_req, reply, payload) => {
      const status = requestContext.get("rateLimitStatus");
      if (!status) {
        return payload;
      }

      if (status.degraded) {
        // Suppress the standard headers: clients seeing fake full quota during
        // a Redis blip would hammer us when Redis came back.
        reply.header(DEGRADED_HEADER, "true");
        return payload;
      }

      const resetSeconds = Math.ceil(status.resetMs / 1_000);
      reply.header(RATE_LIMIT_HEADERS.limit.httpName, status.maxRequests);
      reply.header(
        RATE_LIMIT_HEADERS.remaining.httpName,
        status.remainingRequests,
      );
      reply.header(RATE_LIMIT_HEADERS.reset.httpName, resetSeconds);
      if (status.limitReached) {
        reply.header(RATE_LIMIT_HEADERS.retryAfter.httpName, resetSeconds);
      }
      return payload;
    });
  },
  { name: "rate-limit-response-headers-hook" },
);
