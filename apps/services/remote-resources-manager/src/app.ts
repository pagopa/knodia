import type { LoggerConfig } from "@knodia/logger/config";

import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { serviceName } from "@knodia/fastify-zod-api-commons/models";

import { getK2K2GatewayApiClient } from "./clients/clientsProvider.ts";
import { type RemoteResourcesManagerConfig } from "./config/config.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { remoteResourcesManagerRouter } from "./routers/remoteResourcesManagerRouter.ts";
import { remoteResourcesManagerServiceBuilder } from "./services/remoteResourcesManagerService.ts";

export function buildAppFromConfig(config: RemoteResourcesManagerConfig) {
  const app = buildApp({
    loggerConfig: config,
  });

  return app;
}

function buildApp({ loggerConfig }: { loggerConfig: LoggerConfig }) {
  const k2kGatewayClient = getK2K2GatewayApiClient();
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
    loggerConfig: loggerConfig,
    makeApiProblem,
    serviceName: serviceName.REMOTE_RESOURCES_MANAGER,
  });

  app.register(healthRouter);
  app.register(remoteResourcesManagerRouter, {
    remoteResourcesManagerService:
      remoteResourcesManagerServiceBuilder(k2kGatewayClient),
  });

  return app;
}
