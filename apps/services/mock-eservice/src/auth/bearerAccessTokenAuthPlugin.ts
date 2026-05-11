import type { EserviceAccessTokenClaims } from "@knodia/common-models/auth";
import type { JWTVerifyGetKey } from "jose";

import { requestContext } from "@fastify/request-context";
import { parseAuthHeaderToken } from "@knodia/fastify-zod-api-commons/auth";
import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";
import fastifyPlugin from "fastify-plugin";

import { verifyEserviceAccessToken } from "../utils/validators.ts";

// Augment @fastify/request-context so routers in this service can read the
// verified access-token claims stashed by this plugin.
declare module "@fastify/request-context" {
  interface RequestContextData {
    accessTokenClaims?: EserviceAccessTokenClaims;
  }
}

interface BearerAccessTokenAuthPluginOptions {
  acceptedAudiences: string[];
  expectedIssuer: string;
  jwksResolvers: JWTVerifyGetKey[];
}

export const bearerAccessTokenAuthPlugin =
  fastifyPlugin<BearerAccessTokenAuthPluginOptions>(async (fastify, opts) => {
    fastify.addHook("onRequest", async (request) => {
      if (request.headers["dpop"]) {
        throw unauthorizedError(
          "DPoP proof must not be sent to the Bearer-only endpoint",
        );
      }

      const token = parseAuthHeaderToken(request.headers.authorization);
      const claims = await verifyEserviceAccessToken(token, opts);

      requestContext.set("accessTokenClaims", claims);
    });
  });
