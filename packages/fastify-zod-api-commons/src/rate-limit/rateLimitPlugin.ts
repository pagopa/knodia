import { requestContext } from "@fastify/request-context";
import { type FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { rateLimitKeyFromAuthData } from "../auth/authData.ts";
import { enforceRateLimit } from "./enforceRateLimit.ts";
import { type RateLimiter, type RateLimitKey } from "./rateLimiter.ts";

interface RateLimitPluginOptions {
  // Resolve the bucket key from the request. Default: derive it from `authData`
  // in the request context. Services with bespoke auth (e.g. mock-eservice's
  // bearer/DPoP plugins) pass a custom resolver. `undefined` means "no rate
  // limit applies to this caller" — e.g. internal S2S tokens.
  keyFromRequest?: (req: FastifyRequest) => RateLimitKey | undefined;
  rateLimiter: RateLimiter;
  skip?: (req: FastifyRequest) => boolean;
}

const defaultKeyFromRequest = (): RateLimitKey | undefined => {
  const authData = requestContext.get("authData");
  if (!authData) return undefined;
  // `rateLimitKeyFromAuthData` is exhaustive over `AuthData`, so a future
  // token type that should be rate-limited will surface via ts-pattern at
  // compile time, not at runtime.
  return rateLimitKeyFromAuthData(authData);
};

export const rateLimitPlugin = fastifyPlugin<RateLimitPluginOptions>(
  async (
    fastify,
    { keyFromRequest = defaultKeyFromRequest, rateLimiter, skip },
  ) => {
    fastify.addHook("preHandler", async (req) => {
      if (skip?.(req)) return;

      const key = keyFromRequest(req);
      if (key === undefined) {
        // Protected scopes should always resolve to a key; internal S2S tokens
        // don't, but must never reach a frontier service. An unresolved key here
        // means a request slipped through unlimited — leave a trail rather than
        // bypass silently.
        req.log.warn(
          "Rate limiter skipped: no rate-limit key resolved for request",
        );
        return;
      }

      await enforceRateLimit(rateLimiter, key, req.log);
    });
  },
  { name: "rate-limit-plugin" },
);
