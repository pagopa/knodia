import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

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
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { PurposeProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { purposeRouter } from "./routers/purposeRouter.ts";
import { purposeServiceBuilder } from "./services/purposeService.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";

export function buildApp({
  config,
  readmodelDb,
}: {
  config: AuthConfig & LoggerConfig;
  readmodelDb: NodePgDatabase;
}) {
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
    protectedApp.register(
      purposeRouter,
      purposeServiceBuilder(readmodelServiceBuilder(readmodelDb)),
    );
  });

  return app;
}

export function buildAppFromConfig(config: PurposeProcessConfig) {
  const readmodelPool = new Pool({
    database: config.readmodelDbName,
    host: config.readmodelDbHost,
    password: config.readmodelDbPassword,
    port: config.readmodelDbPort,
    ssl: config.readmodelDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.readmodelDbUser,
  });
  const readmodelDb = drizzle(readmodelPool);

  const app = buildApp({
    config,
    readmodelDb,
  });

  app.addHook("onClose", async () => {
    await readmodelPool.end();
  });

  return app;
}
