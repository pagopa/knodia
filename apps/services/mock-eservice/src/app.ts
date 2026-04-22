import type { LoggerConfig } from "@knodia/logger/config";
import type { FastifyError } from "fastify";

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
          description:
            "Mock producer e-service used to exercise the access-token " +
            "flow end-to-end. Accepts an Orion-issued Bearer token and " +
            "returns a static OK payload.",
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
    // Stubbed — mock-eservice does not participate in the internal
    // API_Problem model. Replaced by the setErrorHandler call below.
    makeApiProblem: () => {
      throw new Error("mock-eservice makeApiProblem should never be called");
    },
  });

  // Plain JSON errors in place of application/problem+json.
  app.setErrorHandler((error: FastifyError, _, reply) => {
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      error: error.name || "Error",
      message: error.message || "Internal Server Error",
      statusCode,
    });
  });

  // Public routes (no auth required)
  app.register(healthRouter);

  // Protected routes — accessTokenAuthPlugin is scoped to this context only.
  // Mock e-service is a frontier service (called directly by external
  // consumers), so no X-Correlation-Id propagation is expected.
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
