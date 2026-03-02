import type { AuthConfig } from "@knodia/fastify-zod-api-commons/config";
import type { LoggerConfig } from "@knodia/logger/config";

import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";

import type { RemoteResourcesManagerConfig } from "./config/config.ts";

import { getK2K2GatewayApiClient } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { remoteResourcesManagerRouter } from "./routers/remoteResourcesManagerRouter.ts";
import { remoteResourcesManagerServiceBuilder } from "./services/remoteResourcesManagerService.ts";

function buildApp({
  config,
  knodeUrl,
}: {
  config: AuthConfig & LoggerConfig;
  knodeUrl: string;
}) {
  const k2kGatewayClient = getK2K2GatewayApiClient({
    knodeUrl,
  });
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
    remoteResourcesManagerService:
      remoteResourcesManagerServiceBuilder(k2kGatewayClient),
  });

  return app;
}

export function buildAppFromConfig(config: RemoteResourcesManagerConfig) {
  return buildApp({ config, knodeUrl: config.knodeUrl });
}
