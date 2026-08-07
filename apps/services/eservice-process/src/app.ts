import type { KnodeId } from "@knodia/common-models/ids";
import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  type DbConnectionOptions,
  makeEventStoreDrizzleConnection,
} from "@knodia/db-event-store-commons/utils";
import { eserviceEventStoreWriterBuilder } from "@knodia/db-event-store-writer/eservice";
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

import type { EserviceProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { eserviceServiceBuilder } from "./services/eserviceService.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";

export function buildApp({
  config,
  eventStoreDb,
  readmodelDb,
}: {
  config: AuthConfig &
    LoggerConfig & {
      isConsumerOperatorIdentificationRequired: boolean;
      knodeId: KnodeId;
    };
  eventStoreDb: NodePgDatabase;
  readmodelDb: NodePgDatabase;
}) {
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description: "API for managing Knodia E-services",
          title: "Knodia E-service Process API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
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
      eserviceRouter,
      eserviceServiceBuilder(
        eserviceEventStoreWriterBuilder(eventStoreDb),
        readmodelServiceBuilder(readmodelDb),
        {
          isConsumerOperatorIdentificationRequired:
            config.isConsumerOperatorIdentificationRequired,
          knodeId: config.knodeId,
        },
      ),
    );
  });

  return app;
}

export async function buildAppFromConfig(
  config: EserviceProcessConfig,
  options?: DbConnectionOptions,
) {
  const { db: eventStoreDb, pool: eventStorePool } =
    await makeEventStoreDrizzleConnection(config, options);
  const { db: readmodelDb, pool: readmodelPool } =
    await makeReadmodelDrizzleConnection(config, options);

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
