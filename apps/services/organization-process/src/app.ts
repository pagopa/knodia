import type { KnodeId } from "@knodia/common-models/ids";
import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  buildCognitoIdmClient,
  type CognitoIdmClientConfig,
} from "@knodia/cognito-idm-client";
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
import { operatorRouter } from "./routers/operatorRouter.ts";
import { organizationRouter } from "./routers/organizationRouter.ts";
import { operatorServiceBuilder } from "./services/operatorService.ts";
import { organizationServiceBuilder } from "./services/organizationService.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";

export function buildApp({
  config,
  eventStoreDb,
  readmodelDb,
}: {
  config: AuthConfig &
    CognitoIdmClientConfig &
    LoggerConfig & { knodeId: KnodeId };
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
          {
            description: "Operator routes",
            name: apiTags.operator,
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
    const organizationService = organizationServiceBuilder(
      organizationEventStoreWriterBuilder(eventStoreDb),
      readmodelServiceBuilder(readmodelDb),
      { knodeId: config.knodeId },
    );
    const operatorService = operatorServiceBuilder(
      buildCognitoIdmClient(config),
    );
    protectedApp.register(organizationRouter, organizationService);
    protectedApp.register(operatorRouter, operatorService);
  });

  return app;
}

export async function buildAppFromConfig(
  config: OrganizationProcessConfig,
  options: { checkDbConnection?: boolean } = {},
) {
  const { db: eventStoreDb, pool: eventStorePool } =
    await makeEventStoreDrizzleConnection(config, {
      checkConnection: options.checkDbConnection,
    });
  const { db: readmodelDb, pool: readmodelPool } =
    await makeReadmodelDrizzleConnection(config, {
      checkConnection: options.checkDbConnection,
    });

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
