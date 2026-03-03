import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { FileManager } from "@knodia/file-manager";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eserviceEventStoreWriterBuilder } from "@knodia/db-event-store-writer/eservice";
import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { initFileManager } from "@knodia/file-manager";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { EserviceProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { eserviceServiceBuilder } from "./services/eserviceService.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";

export function buildApp({
  config,
  eventStoreDb,
  fileManager,
  readmodelDb,
}: {
  config: AuthConfig & LoggerConfig & { eserviceInterfacesS3Bucket: string };
  eventStoreDb: NodePgDatabase;
  fileManager: FileManager;
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
    loggerConfig: config,
    makeApiProblem,
    serviceName: "eservice-process",
  });

  app.register(authenticationPlugin, config);
  app.register(healthRouter);
  app.register(eserviceRouter, {
    eserviceInterfacesS3Bucket: config.eserviceInterfacesS3Bucket,
    eserviceService: eserviceServiceBuilder(
      eserviceEventStoreWriterBuilder(eventStoreDb),
      readmodelServiceBuilder(readmodelDb),
    ),
    fileManager,
  });

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

  const readmodelPool = new Pool({
    database: config.readmodelDbName,
    host: config.readmodelDbHost,
    password: config.readmodelDbPassword,
    port: config.readmodelDbPort,
    ssl: config.readmodelDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.readmodelDbUser,
  });
  const readmodelDb = drizzle(readmodelPool);

  const fileManager = initFileManager();

  const app = buildApp({
    config,
    eventStoreDb,
    fileManager,
    readmodelDb,
  });

  app.addHook("onClose", async () => {
    await eventStorePool.end();
    await readmodelPool.end();
  });

  return app;
}
