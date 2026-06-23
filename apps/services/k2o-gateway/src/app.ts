import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";

import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import {
  type RateLimiter,
  rateLimitPlugin,
  rateLimitResponseHeadersPlugin,
} from "@knodia/fastify-zod-api-commons/rate-limit";
import {
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";

import type { K2OGatewayConfig } from "./config/config.ts";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { producerKeychainRouter } from "./routers/producerKeychainRouter.ts";

export function buildApp({
  config,
  keychainProcessUrl,
  rateLimiter,
}: {
  config: AuthConfig & LoggerConfig;
  keychainProcessUrl: string;
  rateLimiter: RateLimiter;
}) {
  const clients = getKnodiaClients({
    keychainProcessUrl,
  });

  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description:
            "API that Organizations from any Knode can use to communicate with this Knode",
          title: "Knode to Organization API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
        servers: [{ description: "Knode to Organization API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Router related to Producer Keychains",
            name: apiTags.producerKeychain,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
  });

  app.register(rateLimitResponseHeadersPlugin);

  // Public routes (no auth required)
  app.register(healthRouter);

  // Protected routes — authenticationPlugin hook is scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(rateLimitPlugin, { rateLimiter });
    protectedApp.register(producerKeychainRouter, {
      keychainProcessClient: clients.keychainProcessClient,
    });
  });

  app.addHook("onClose", async () => {
    await rateLimiter.disconnect();
  });

  return app;
}

export function buildAppFromConfig(
  config: K2OGatewayConfig,
  rateLimiter: RateLimiter,
) {
  const app = buildApp({
    config,
    keychainProcessUrl: config.keychainProcessUrl,
    rateLimiter,
  });

  return app;
}
