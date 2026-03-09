import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { OrganizationProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { organizationRouter } from "./routers/organizationRouter.ts";
import { organizationServiceBuilder } from "./services/organizationService.ts";
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
        info: {
          description: "API for managing Knodia Organizations",
          title: "Knodia Organization Process API",
          version: "1.0.0",
        },
        servers: [{ description: "Organization Process API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Organization routes",
            name: apiTags.organization,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
    serviceName: "organization-process",
  });

  app.register(healthRouter);

  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(
      organizationRouter,
      organizationServiceBuilder(readmodelServiceBuilder(readmodelDb)),
    );
  });

  return app;
}

export function buildAppFromConfig(config: OrganizationProcessConfig) {
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
