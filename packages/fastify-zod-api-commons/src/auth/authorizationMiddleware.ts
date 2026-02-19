import { requestContext } from "@fastify/request-context";
import { TokenClaims } from "@knodia/common-models/tokenCodecs";
import fastifyPlugin from "fastify-plugin";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { unauthorizedError } from "../models/errors/errors.ts";
import { healthRouterUrl } from "../routers/healthRouter.ts";
import { docsRoutePrefix } from "../utils/openapi-zod-plugin/openapiZodPlugin.ts";
import { extractAuthData } from "./authData.ts";

interface AuthorizationMiddlewareOptions {
  acceptedAudiences: string[];
  wellKnownUrls: string[];
}

export const authorizationMiddleware =
  fastifyPlugin<AuthorizationMiddlewareOptions>(async (fastify, opts) => {
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

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw unauthorizedError("Missing or invalid Authorization header");
      }

      const token = authHeader.slice(7);

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

      const parsed = TokenClaims.safeParse(rawPayload);
      if (!parsed.success) {
        throw unauthorizedError("Invalid token claims");
      }

      requestContext.set("authData", extractAuthData(parsed.data));
    });
  });
