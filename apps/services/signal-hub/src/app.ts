import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { makeReadmodelDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
import { signalHubDbServiceBuilder } from "@knodia/db-signal-hub/services";
import { makeSignalHubDrizzleConnection } from "@knodia/db-signal-hub/utils";
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
import { signalHubRouter } from "./routers/signalHubRouter.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";
import { signalHubServiceBuilder } from "./services/signalHubService.ts";

export function buildApp({
  config,
  readmodelDb,
  signalHubDb,
}: {
  config: AuthConfig & LoggerConfig;
  readmodelDb: NodePgDatabase;
  signalHubDb: NodePgDatabase;
}) {
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

  // Protected routes — authenticationPlugin hook is scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(signalHubRouter, {
      signalHubService: signalHubServiceBuilder(
        readmodelServiceBuilder(readmodelDb),
        signalHubDbServiceBuilder(signalHubDb),
      ),
    });
  });

  return app;
}

export function buildAppFromConfig(config: SignalHubConfig) {
  const { db: readmodelDb, pool: readmodelPool } =
    makeReadmodelDrizzleConnection(config);
  const { db: signalHubDb, pool: signalHubPool } =
    makeSignalHubDrizzleConnection(config);

  const app = buildApp({
    config,
    readmodelDb,
    signalHubDb,
  });

  app.addHook("onClose", async () => {
    await Promise.all([readmodelPool.end(), signalHubPool.end()]);
  });

  return app;
}
