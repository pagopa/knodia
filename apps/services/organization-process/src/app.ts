import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { makeEventStoreDrizzleConnection } from "@knodia/db-event-store-commons/utils";
import { organizationEventStoreWriterBuilder } from "@knodia/db-event-store-writer/organization";
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

import type { OrganizationProcessConfig } from "./config/config.ts";

import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { organizationRouter } from "./routers/organizationRouter.ts";
import { organizationServiceBuilder } from "./services/organizationService.ts";
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
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description: "API for managing Knodia Organizations",
          title: "Knodia Organization Process API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
        servers: [{ description: "Organization Process API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Organization routes",
            name: apiTags.organization,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
    serviceName: "organization-process",
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
      organizationRouter,
      organizationServiceBuilder(
        organizationEventStoreWriterBuilder(eventStoreDb),
        readmodelServiceBuilder(readmodelDb),
      ),
    );
  });

  return app;
}

export function buildAppFromConfig(config: OrganizationProcessConfig) {
  const { db: eventStoreDb, pool: eventStorePool } =
    makeEventStoreDrizzleConnection(config);
  const { db: readmodelDb, pool: readmodelPool } =
    makeReadmodelDrizzleConnection(config);

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
