import type { LoggerConfig } from "@knodia/logger/config";

import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import {
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";
import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";

import type { MockEserviceConfig } from "./config/config.ts";

import { accessTokenAuthPlugin } from "./auth/accessTokenAuthPlugin.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { mockRouter } from "./routers/mockRouter.ts";

export function buildApp({
  acceptedAudience,
  config,
  expectedIssuer,
  jwksResolvers,
}: {
  acceptedAudience: string;
  config: LoggerConfig;
  expectedIssuer: string;
  jwksResolvers: JWTVerifyGetKey[];
}) {
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description: "Mock e-service API endpoints",
          title: "Knodia Mock E-service API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
        servers: [{ description: "Mock E-service API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Mock e-service data routes",
            name: apiTags.mock,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
  });

  // Public routes (no auth required)
  app.register(healthRouter);

  // Protected routes — accessTokenAuthPlugin is scoped to this context only.
  app.register(async (protectedApp) => {
    protectedApp.register(accessTokenAuthPlugin, {
      acceptedAudience,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockRouter);
  });

  return app;
}

export function buildAppFromConfig(config: MockEserviceConfig) {
  return buildApp({
    acceptedAudience: config.acceptedAudience,
    config,
    expectedIssuer: config.expectedIssuer,
    jwksResolvers: config.wellKnownUrls.map((url) =>
      createRemoteJWKSet(new URL(url)),
    ),
  });
}
