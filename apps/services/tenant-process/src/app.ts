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

import type { TenantProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { tenantRouter } from "./routers/tenantRouter.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";
import { tenantServiceBuilder } from "./services/tenantService.ts";

export function buildAppFromConfig(config: TenantProcessConfig) {
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

function buildApp({
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
          description: "API for managing Knodia Tenants",
          title: "Knodia Tenant Process API",
          version: "1.0.0",
        },
        servers: [{ description: "Tenant Process API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Tenant routes",
            name: apiTags.tenant,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
    serviceName: "tenant-process",
  });

  app.register(authenticationPlugin, config);
  app.register(healthRouter);
  app.register(
    tenantRouter,
    tenantServiceBuilder(readmodelServiceBuilder(readmodelDb)),
  );

  return app;
}
