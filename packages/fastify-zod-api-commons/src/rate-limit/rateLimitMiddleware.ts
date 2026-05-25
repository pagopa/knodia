import { requestContext } from "@fastify/request-context";
import { type FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { tenantIdFromAuthData } from "../auth/authData.ts";
import { enforceRateLimit } from "./enforceRateLimit.ts";
import { type RateLimiter } from "./rateLimiter.ts";

interface RateLimitMiddlewareOptions {
  rateLimiter: RateLimiter;
  skip?: (req: FastifyRequest) => boolean;
}

// Fallback bucket for authData shapes that resolve no tenant id. Protected
// scopes always have one today; the constant exists so a future authData
// variant doesn't silently skip the limit.
const UNKEYABLE_BUCKET = "__unkeyable__";

export const rateLimitMiddleware = fastifyPlugin<RateLimitMiddlewareOptions>(
  async (fastify, { rateLimiter, skip }) => {
    fastify.addHook("preHandler", async (req) => {
      const authData = requestContext.get("authData");
      // Internal S2S tokens carry no tenant — skip rather than collapse every
      // internal caller into one shared bucket.
      if (!authData || authData.tokenType === "internal") return;
      if (skip?.(req)) return;

      const key = tenantIdFromAuthData(authData) ?? UNKEYABLE_BUCKET;
      await enforceRateLimit(rateLimiter, key, req.log);
    });
  },
  { name: "rate-limit-middleware" },
);
