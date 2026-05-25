import { requestContext } from "@fastify/request-context";
import { genericInternalError } from "@knodia/common-models/errors";
import { type FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { tenantIdFromAuthData } from "../auth/authData.ts";
import { enforceRateLimit } from "./enforceRateLimit.ts";
import { type RateLimiter } from "./rateLimiter.ts";

interface RateLimitMiddlewareOptions {
  rateLimiter: RateLimiter;
  skip?: (req: FastifyRequest) => boolean;
}

export const rateLimitMiddleware = fastifyPlugin<RateLimitMiddlewareOptions>(
  async (fastify, { rateLimiter, skip }) => {
    fastify.addHook("preHandler", async (req) => {
      const authData = requestContext.get("authData");
      // Internal S2S tokens carry no tenant — skip rather than collapse every
      // internal caller into one shared bucket.
      if (!authData || authData.tokenType === "internal") return;
      if (skip?.(req)) return;

      const key = tenantIdFromAuthData(authData);
      // Authoritative invariant: every non-internal authData must resolve a
      // tenant. A future authData variant that forgets to extend
      // tenantIdFromAuthData should fail loudly, not silently bucket every
      // caller of that type into one shared global cap.
      if (key === undefined) {
        throw genericInternalError(
          `Unkeyable authData for rate-limit (tokenType=${authData.tokenType})`,
        );
      }

      await enforceRateLimit(rateLimiter, key, req.log);
    });
  },
  { name: "rate-limit-middleware" },
);
