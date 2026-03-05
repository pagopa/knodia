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

import type { RemoteResourcesManagerConfig } from "./config/config.ts";

import { getK2K2GatewayApiClient } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { remoteResourcesManagerRouter } from "./routers/remoteResourcesManagerRouter.ts";
import { remoteResourceDbServiceBuilder } from "./services/remoteResourceService.ts";
import { remoteResourcesManagerServiceBuilder } from "./services/remoteResourcesManagerService.ts";

export function buildApp({
  config,
  knodeUrl,
  remoteResourceDb,
}: {
  config: AuthConfig & LoggerConfig;
  knodeUrl: string;
  remoteResourceDb: NodePgDatabase;
}) {
  const k2kGatewayClient = getK2K2GatewayApiClient({
    knodeUrl,
  });
  const remoteResourceDbService =
    remoteResourceDbServiceBuilder(remoteResourceDb);
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description: "Knodia remote-resources-manager API",
          title: "Knodia Remote Resources Manager API",
          version: "1.0.0",
        },
        servers: [{ description: "Remote Resources Manager API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "K2K Gateway routes",
            name: apiTags.k2kGateway,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
    serviceName: "remote-resources-manager",
  });

  app.register(authenticationPlugin, config);
  app.register(healthRouter);
  app.register(remoteResourcesManagerRouter, {
    remoteResourceDbService,
    remoteResourcesManagerService:
      remoteResourcesManagerServiceBuilder(k2kGatewayClient),
  });

  return app;
}

export function buildAppFromConfig(config: RemoteResourcesManagerConfig) {
  const remoteResourcePool = new Pool({
    database: config.remoteResourceDbName,
    host: config.remoteResourceDbHost,
    password: config.remoteResourceDbPassword,
    port: config.remoteResourceDbPort,
    ssl: config.remoteResourceDbUseSsl
      ? { rejectUnauthorized: false }
      : undefined,
    user: config.remoteResourceDbUser,
  });
  const remoteResourceDb = drizzle(remoteResourcePool);

  const app = buildApp({
    config,
    knodeUrl: config.knodeUrl,
    remoteResourceDb,
  });

  app.addHook("onClose", async () => {
    await remoteResourcePool.end();
  });

  return app;
}
