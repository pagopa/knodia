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
import { readModelServiceBuilder } from "./services/readModelService.ts";

export function buildApp({
  eventStoreDb,
  loggerConfig,
  readModelDb,
}: {
  eventStoreDb: NodePgDatabase;
  loggerConfig: LoggerConfig;
  readModelDb: NodePgDatabase;
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
      readModelServiceBuilder(readModelDb),
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
    database: config.readModelDbName,
    host: config.readModelDbHost,
    password: config.readModelDbPassword,
    port: config.readModelDbPort,
    ssl: config.readModelDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.readModelDbUser,
  });
  const readModelDb = drizzle(readModelPool);

  const app = buildApp({
    eventStoreDb,
    loggerConfig: config,
    readModelDb,
  });

  app.addHook("onClose", async () => {
    await eventStorePool.end();
    await readModelPool.end();
  });

  return app;
}
