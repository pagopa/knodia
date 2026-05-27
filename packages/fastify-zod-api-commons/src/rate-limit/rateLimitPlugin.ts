import type { ExternalId } from "@knodia/common-models/externalResource";
import type { OrganizationId } from "@knodia/common-models/ids";

import { requestContext } from "@fastify/request-context";
import { type FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { callerOrganizationIdFromAuthData } from "../auth/authData.ts";
import { enforceRateLimit } from "./enforceRateLimit.ts";
import { type RateLimiter } from "./rateLimiter.ts";

type RateLimitKey = ExternalId<OrganizationId> | OrganizationId;

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
  // `callerOrganizationIdFromAuthData` is exhaustive over `AuthData`, so a
  // future token type that should be rate-limited will surface via
  // ts-pattern at compile time, not at runtime.
  return callerOrganizationIdFromAuthData(authData);
};

export const rateLimitPlugin = fastifyPlugin<RateLimitPluginOptions>(
  async (
    fastify,
    { keyFromRequest = defaultKeyFromRequest, rateLimiter, skip },
  ) => {
    fastify.addHook("preHandler", async (req) => {
      if (skip?.(req)) return;

      const key = keyFromRequest(req);
      if (key === undefined) return;

      await enforceRateLimit(rateLimiter, key, req.log);
    });
  },
  { name: "rate-limit-plugin" },
);
