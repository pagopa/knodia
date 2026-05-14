import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import {
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";

import type { SignalHubConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { signalRouter } from "./routers/signalRouter.ts";

export function buildAppFromConfig(config: SignalHubConfig) {
  const app = buildApp({ config });

  return app;
}

function buildApp({ config }: { config: SignalHubConfig }) {
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description: "API for managing Knodia Signal Hub",
          title: "Knodia Signal Hub API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
        servers: [{ description: "Signal Hub API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Signal Hub routes",
            name: apiTags.signalHub,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
  });

  // Public routes (no auth required)
  app.register(healthRouter);

  // Protected routes — authenticationPlugin is scoped to this context only.
  // signal-hub is a frontier service: it does not require an inbound
  // x-correlation-id header (correlationId is generated per request by
  // createFastifyApp's genReqId).
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(signalRouter);
  });

  return app;
}
