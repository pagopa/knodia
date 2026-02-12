import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eserviceEventStoreWriterBuilder } from "@knodia/db-event-store-writer/eservice";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { serviceName } from "@knodia/fastify-zod-api-commons/models";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { EserviceProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { eserviceServiceBuilder } from "./services/eserviceService.ts";
import { readmodelServiceBuilder } from "./services/readModelService.ts";

export function buildApp({
  eventStoreDb,
  loggerConfig,
  readmodelDb,
}: {
  eventStoreDb: NodePgDatabase;
  loggerConfig: LoggerConfig;
  readmodelDb: NodePgDatabase;
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
    serviceName: serviceName.ESERVICE_PROCESS,
  });

  app.register(healthRouter);
  app.register(
    eserviceRouter,
    eserviceServiceBuilder(
      eserviceEventStoreWriterBuilder(eventStoreDb),
      readmodelServiceBuilder(readmodelDb),
    ),
  );

  return app;
}

export function buildAppFromConfig(config: EserviceProcessConfig) {
  const eventStorePool = new Pool({
    database: config.eventStoreDbName,
    host: config.eventStoreDbHost,
    password: config.eventStoreDbPassword,
    port: config.eventStoreDbPort,
    ssl: config.eventStoreDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.eventStoreDbUser,
  });
  const eventStoreDb = drizzle(eventStorePool);

  const readModelPool = new Pool({
    database: config.readmodelDbName,
    host: config.readmodelDbHost,
    password: config.readmodelDbPassword,
    port: config.readmodelDbPort,
    ssl: config.readmodelDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.readmodelDbUser,
  });
  const readmodelDb = drizzle(readModelPool);

  const app = buildApp({
    eventStoreDb,
    loggerConfig: config,
    readmodelDb,
  });

  app.addHook("onClose", async () => {
    await eventStorePool.end();
    await readModelPool.end();
  });

  return app;
}
