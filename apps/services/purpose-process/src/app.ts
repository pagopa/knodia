import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { makeEventStoreDrizzleConnection } from "@knodia/db-event-store-commons/utils";
import { purposeEventStoreWriterBuilder } from "@knodia/db-event-store-writer/purpose";
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
import { initFileManager } from "@knodia/file-manager";

import type { PurposeProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { purposeRouter } from "./routers/purposeRouter.ts";
import {
  type FormSchemaStore,
  formSchemaStoreBuilder,
} from "./services/formSchemaStore.ts";
import { purposeServiceBuilder } from "./services/purposeService.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";

export function buildApp({
  config,
  eventStoreDb,
  formSchemaStore,
  readmodelDb,
}: {
  config: AuthConfig & LoggerConfig;
  eventStoreDb: NodePgDatabase;
  formSchemaStore: FormSchemaStore;
  readmodelDb: NodePgDatabase;
}) {
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description: "API for managing Knodia Purposes",
          title: "Knodia Purpose Process API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
        servers: [{ description: "Purpose Process API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Purpose routes",
            name: apiTags.purpose,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
  });

  // Public routes (no auth required)
  app.register(healthRouter);

  // Protected routes — authenticationPlugin and requireCorrelationIdHeaderPlugin
  // hooks are scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(requireCorrelationIdHeaderPlugin, { makeApiProblem });
    protectedApp.register(purposeRouter, {
      purposeService: purposeServiceBuilder(
        purposeEventStoreWriterBuilder(eventStoreDb),
        readmodelServiceBuilder(readmodelDb),
        formSchemaStore,
      ),
    });
  });

  return app;
}

export function buildAppFromConfig(config: PurposeProcessConfig) {
  const { db: eventStoreDb, pool: eventStorePool } =
    makeEventStoreDrizzleConnection(config);
  const { db: readmodelDb, pool: readmodelPool } =
    makeReadmodelDrizzleConnection(config);

  const formSchemaStore = formSchemaStoreBuilder({
    bucket: config.purposeFormsBucket,
    fileManager: initFileManager(),
  });

  const app = buildApp({
    config,
    eventStoreDb,
    formSchemaStore,
    readmodelDb,
  });

  app.addHook("onClose", async () => {
    await eventStorePool.end();
    await readmodelPool.end();
  });

  return app;
}
