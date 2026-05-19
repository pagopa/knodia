import type { TargetKnodeUrls } from "@knodia/common-models/targetKnodeUrls";
import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { makeReadmodelDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
import { remoteResourceDbServiceBuilder } from "@knodia/db-remote-resource/services";
import { makeRemoteResourceDrizzleConnection } from "@knodia/db-remote-resource/utils";
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

import type { RemoteResourcesManagerConfig } from "./config/config.ts";

import { makeK2K2GatewayApiClientFactory } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { agreementRouter } from "./routers/agreementRouter.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { organizationRouter } from "./routers/organizationRouter.ts";
import { purposeRouter } from "./routers/purposeRouter.ts";
import { agreementServiceBuilder } from "./services/agreementService.ts";
import { eserviceServiceBuilder } from "./services/eserviceService.ts";
import { organizationServiceBuilder } from "./services/organizationService.ts";
import { purposeServiceBuilder } from "./services/purposeService.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";

export function buildApp({
  config,
  readmodelDb,
  remoteResourceDb,
  targetKnodeUrls,
}: {
  config: AuthConfig & LoggerConfig;
  readmodelDb: NodePgDatabase;
  remoteResourceDb: NodePgDatabase;
  targetKnodeUrls: TargetKnodeUrls;
}) {
  const remoteResourceDbService =
    remoteResourceDbServiceBuilder(remoteResourceDb);
  const readmodelService = readmodelServiceBuilder(readmodelDb);
  const getK2K2GatewayApiClient =
    makeK2K2GatewayApiClientFactory(targetKnodeUrls);

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
            description: "Routes related to Agreements",
            name: apiTags.agreement,
          },
          {
            description: "Routes related to E-services",
            name: apiTags.eservice,
          },
          {
            description: "Routes related to Purposes",
            name: apiTags.purpose,
          },
          {
            description: "Routes related to Organizations",
            name: apiTags.organization,
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
    protectedApp.register(eserviceRouter, {
      eserviceService: eserviceServiceBuilder(
        getK2K2GatewayApiClient,
        remoteResourceDbService,
      ),
    });
    protectedApp.register(agreementRouter, {
      agreementService: agreementServiceBuilder(
        getK2K2GatewayApiClient,
        remoteResourceDbService,
        readmodelService,
      ),
    });
    protectedApp.register(purposeRouter, {
      purposeService: purposeServiceBuilder(
        getK2K2GatewayApiClient,
        remoteResourceDbService,
        readmodelService,
      ),
    });
    protectedApp.register(organizationRouter, {
      organizationService: organizationServiceBuilder(getK2K2GatewayApiClient),
    });
  });

  return app;
}

export function buildAppFromConfig(config: RemoteResourcesManagerConfig) {
  const { db: remoteResourceDb, pool: remoteResourcePool } =
    makeRemoteResourceDrizzleConnection(config);
  const { db: readmodelDb, pool: readmodelPool } =
    makeReadmodelDrizzleConnection(config);

  const app = buildApp({
    config,
    readmodelDb,
    remoteResourceDb,
    targetKnodeUrls: config.targetKnodeUrls,
  });

  app.addHook("onClose", async () => {
    await remoteResourcePool.end();
    await readmodelPool.end();
  });

  return app;
}
