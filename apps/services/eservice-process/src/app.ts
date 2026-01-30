import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eserviceEventStoreWriterBuilder } from "@knodia/db-event-store-writer/eservice";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { EserviceProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { eserviceServiceBuilder } from "./services/eserviceService.ts";

export function buildApp({
  eventStoreDb,
  loggerConfig,
  serviceName,
}: {
  eventStoreDb: NodePgDatabase;
  loggerConfig: LoggerConfig;
  serviceName: string;
}) {
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description: "API for managing Knodia E-services",
          title: "Knodia E-service Process API",
          version: "1.0.0",
        },
        servers: [{ description: "E-service Process API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "E-services routes",
            name: apiTags.eservice,
          },
        ],
      },
    },
    loggerConfig,
    makeApiProblem,
    serviceName,
  });

  app.register(healthRouter);
  app.register(
    eserviceRouter,
    eserviceServiceBuilder(eserviceEventStoreWriterBuilder(eventStoreDb)),
  );

  return app;
}

export function buildAppFromConfig(config: EserviceProcessConfig) {
  const pool = new Pool({
    database: config.eventStoreDbName,
    host: config.eventStoreDbHost,
    password: config.eventStoreDbPassword,
    port: config.eventStoreDbPort,
    ssl: config.eventStoreDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.eventStoreDbUser,
  });

  const eventStoreDb = drizzle(pool);

  const app = buildApp({
    eventStoreDb,
    loggerConfig: config,
    serviceName: config.serviceName,
  });

  app.addHook("onClose", async () => {
    await pool.end();
  });

  return app;
}
