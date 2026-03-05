import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { keychainEventStoreWriterBuilder } from "@knodia/db-event-store-writer/keychain";
import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import {
  requireCorrelationIdHeaderPlugin,
  createFastifyApp,
} from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { KeychainProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { consumerKeychainRouter } from "./routers/consumerKeychainRouter.ts";
import { consumerKeychainServiceBuilder } from "./services/consumerKeychainService.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";

export function buildApp({
  config,
  eventStoreDb,
  readmodelDb,
}: {
  config: AuthConfig & LoggerConfig;
  eventStoreDb: NodePgDatabase;
  readmodelDb: NodePgDatabase;
}) {
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description: "API for managing Knodia Keychains",
          title: "Knodia Keychain Process API",
          version: "1.0.0",
        },
        servers: [{ description: "Keychain Process API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Consumer keychain routes",
            name: apiTags.consumerKeychain,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
    serviceName: "keychain-process",
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
      consumerKeychainRouter,
      consumerKeychainServiceBuilder(
        keychainEventStoreWriterBuilder(eventStoreDb),
        readmodelServiceBuilder(readmodelDb),
      ),
    );
  });

  return app;
}

export function buildAppFromConfig(config: KeychainProcessConfig) {
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

  const app = buildApp({
    config,
    eventStoreDb,
    readmodelDb,
  });

  app.addHook("onClose", async () => {
    await eventStorePool.end();
    await readmodelPool.end();
  });

  return app;
}
