import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { remoteResourceDbServiceBuilder } from "@knodia/db-remote-resource/services";
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

import type { RemoteResourcesManagerConfig } from "./config/config.ts";

import { getK2K2GatewayApiClient } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { remoteResourcesManagerRouter } from "./routers/remoteResourcesManagerRouter.ts";
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

  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description: "Knodia remote-resources-manager API",
          title: "Knodia Remote Resources Manager API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
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

  // Public routes (no auth required)
  app.register(healthRouter);

  // Protected routes — authenticationPlugin and requireCorrelationIdHeaderPlugin
  // hooks are scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(requireCorrelationIdHeaderPlugin, { makeApiProblem });
    protectedApp.register(remoteResourcesManagerRouter, {
      remoteResourceDbService: remoteResourceDbServiceBuilder(remoteResourceDb),
      remoteResourcesManagerService:
        remoteResourcesManagerServiceBuilder(k2kGatewayClient),
    });
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
