import type { HTTPServiceLoggerMetadata } from "@knodia/logger/models";

import { requestContext } from "@fastify/request-context";
import { KnodiaAuthTokenClaims } from "@knodia/common-models/auth";
import { type CorrelationId, unsafeBrandId } from "@knodia/common-models/ids";
import fastifyPlugin from "fastify-plugin";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { match } from "ts-pattern";

import { unauthorizedError } from "../models/errors/errors.ts";
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
      const token = parseAuthHeaderToken(request.headers.authorization);

      const rawPayload = await Promise.any(
        jwksSets.map(async (jwks) => {
          const { payload } = await jwtVerify(token, jwks, {
            audience: opts.acceptedAudiences,
          });
          return payload;
        }),
      ).catch(() => {
        throw unauthorizedError("Token verification failed");
      });

      const parsed = KnodiaAuthTokenClaims.safeParse(rawPayload);
      if (!parsed.success) {
        throw unauthorizedError("Invalid token claims");
      }

      const authData = extractAuthDataFromToken(parsed.data);
      requestContext.set("authData", authData);

      const correlationId = unsafeBrandId<CorrelationId>(request.id);
      const loggerMetadata: HTTPServiceLoggerMetadata = match(authData)
        .with({ tokenType: "ui-session" }, (a) => ({
          correlationId,
          organizationId: a.organizationId,
          userId: a.userId,
        }))
        .with({ tokenType: "internal" }, () => ({
          correlationId,
        }))
        .with({ tokenType: "external-ui-session" }, () => ({
          correlationId,
        }))
        .exhaustive();
      const logger = request.log.child(loggerMetadata);
      request.log = logger;
      requestContext.set("logger", logger);
    });
  },
);
