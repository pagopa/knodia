import { requestContext } from "@fastify/request-context";
import { type FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { rateLimitKeyFromAuthData } from "../auth/authData.ts";
import { enforceRateLimit } from "./enforceRateLimit.ts";
import { type RateLimiter, type RateLimitKey } from "./rateLimiter.ts";

interface RateLimitPluginOptions {
  // Resolve the bucket key from the request. Default: derive it from
  // `authData` in the request context (set by `authenticationPlugin` on
  // services that use Knodia token types). Services with bespoke auth
  // (e.g. mock-eservice's bearer/DPoP plugins, which set `accessTokenClaims`
  // instead) pass a custom resolver. Returning `undefined` means "no rate
  // limit applies to this caller" — used today for internal S2S tokens.
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
        // The plugin is only mounted on protected scopes whose callers should
        // always resolve to an organization key. Internal S2S tokens have none
        // by design, but they must never reach a frontier service — so an
        // unresolved key here means a request slipped through unlimited and we
        // want a trail for it rather than a silent bypass.
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
