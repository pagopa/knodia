import { requestContext } from "@fastify/request-context";
import { KnodiaTokenClaims } from "@knodia/common-models/auth";
import fastifyPlugin from "fastify-plugin";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { unauthorizedError } from "../models/errors/errors.ts";
import { healthRouterUrl } from "../routers/healthRouter.ts";
import { docsRoutePrefix } from "../utils/openapi-zod-plugin/openapiZodPlugin.ts";
import { extractAuthDataFromToken } from "./authData.ts";

const BEARER_PREFIX = "bearer ";

interface AuthenticationPluginOptions {
  acceptedAudiences: string[];
  wellKnownUrls: string[];
}

export const parseAuthHeaderToken = (authHeader: string | undefined) => {
  if (!authHeader?.toLowerCase().startsWith(BEARER_PREFIX)) {
    throw unauthorizedError("Missing or invalid Authorization header");
  }

  return authHeader.substring(BEARER_PREFIX.length);
};

export const authenticationPlugin = fastifyPlugin<AuthenticationPluginOptions>(
  async (fastify, opts) => {
    const jwksSets = opts.wellKnownUrls.map((url) =>
      createRemoteJWKSet(new URL(url)),
    );

    fastify.addHook("onRequest", async (request) => {
      if (
        request.url === healthRouterUrl ||
        request.url.startsWith(docsRoutePrefix)
      ) {
        return;
      }

      const token = parseAuthHeaderToken(request.headers.authorization);

      let rawPayload: unknown = null;
      for (const jwks of jwksSets) {
        try {
          const { payload } = await jwtVerify(token, jwks, {
            audience: opts.acceptedAudiences,
          });
          rawPayload = payload;
          break;
        } catch {
          // Try next JWKS set
        }
      }

      if (rawPayload === null) {
        throw unauthorizedError("Token verification failed");
      }

      const parsed = KnodiaTokenClaims.safeParse(rawPayload);
      if (!parsed.success) {
        throw unauthorizedError("Invalid token claims");
      }

      requestContext.set("authData", extractAuthDataFromToken(parsed.data));
    });
  },
);
