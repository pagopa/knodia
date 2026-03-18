import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";

import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import {
  createFastifyApp,
  requireCorrelationIdHeaderPlugin,
} from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import {
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";

import type { PurposeProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { purposeRouter } from "./routers/purposeRouter.ts";
import { purposeServiceBuilder } from "./services/purposeService.ts";

export function buildApp({ config }: { config: AuthConfig & LoggerConfig }) {
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description: "API for managing Knodia Purposes",
          title: "Knodia Purpose Process API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
        servers: [{ description: "Purpose Process API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Purpose routes",
            name: apiTags.purpose,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
    serviceName: "purpose-process",
  });

  // Public routes (no auth required)
  app.register(healthRouter);

  // Protected routes — authenticationPlugin and requireCorrelationIdHeaderPlugin
  // hooks are scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(requireCorrelationIdHeaderPlugin, { makeApiProblem });
    protectedApp.register(purposeRouter, purposeServiceBuilder());
  });

  return app;
}

export function buildAppFromConfig(config: PurposeProcessConfig) {
  return buildApp({ config });
}
