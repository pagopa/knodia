import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { makeEventStoreDrizzleConnection } from "@knodia/db-event-store-commons/utils";
import { keychainEventStoreWriterBuilder } from "@knodia/db-event-store-writer/keychain";
import { makeReadmodelDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
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

import type { KeychainProcessConfig } from "./config/config.ts";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { consumerKeychainRouter } from "./routers/consumerKeychainRouter.ts";
import { knodeApiKeychainRouter } from "./routers/knodeApiKeychainRouter.ts";
import { userRouter } from "./routers/userRouter.ts";
import { consumerKeychainServiceBuilder } from "./services/consumerKeychainService.ts";
import { knodeApiKeychainServiceBuilder } from "./services/knodeApiKeychainService.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";
import { userServiceBuilder } from "./services/userService.ts";

export function buildApp({
  config,
  eventStoreDb,
  readmodelDb,
  remoteResourcesManagerUrl,
}: {
  config: AuthConfig &
    LoggerConfig &
    Pick<KeychainProcessConfig, "cognitoUserPoolId" | "maxKeysPerKeychain">;
  eventStoreDb: NodePgDatabase;
  readmodelDb: NodePgDatabase;
  remoteResourcesManagerUrl: string;
}) {
  const clients = getKnodiaClients({
    remoteResourcesManagerUrl,
  });

  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description: "API for managing Knodia Keychains",
          title: "Knodia Keychain Process API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
        servers: [{ description: "Keychain Process API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Consumer keychain routes",
            name: apiTags.consumerKeychain,
          },
          {
            description: "Knode API keychain routes",
            name: apiTags.knodeApiKeychain,
          },
          {
            description: "User routes",
            name: apiTags.user,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
  });

  const userService = userServiceBuilder({
    userPoolId: config.cognitoUserPoolId,
  });

  // Public routes (no auth required)
  app.register(healthRouter);

  // Protected routes — authenticationPlugin and requireCorrelationIdHeaderPlugin
  // hooks are scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(requireCorrelationIdHeaderPlugin, { makeApiProblem });

    const eventStoreWriter = keychainEventStoreWriterBuilder(eventStoreDb);
    const readmodelService = readmodelServiceBuilder(readmodelDb);

    protectedApp.register(consumerKeychainRouter, {
      consumerKeychainService: consumerKeychainServiceBuilder(
        eventStoreWriter,
        readmodelService,
        userService,
        clients.remoteResourcesManagerClient,
        config,
      ),
    });
    protectedApp.register(knodeApiKeychainRouter, {
      knodeApiKeychainService: knodeApiKeychainServiceBuilder(),
    });
    protectedApp.register(userRouter, userService);
  });

  return app;
}

export function buildAppFromConfig(config: KeychainProcessConfig) {
  const { db: eventStoreDb, pool: eventStorePool } =
    makeEventStoreDrizzleConnection(config);
  const { db: readmodelDb, pool: readmodelPool } =
    makeReadmodelDrizzleConnection(config);

  const app = buildApp({
    config,
    eventStoreDb,
    readmodelDb,
    remoteResourcesManagerUrl: config.remoteResourcesManagerUrl,
  });

  app.addHook("onClose", async () => {
    await eventStorePool.end();
    await readmodelPool.end();
  });

  return app;
}
