import type { LoggerConfig } from "@knodia/logger/config";

import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { serviceName } from "@knodia/fastify-zod-api-commons/models";

import type { ApiGatewayConfig } from "./config/config.ts";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

export function buildApp({ loggerConfig }: { loggerConfig: LoggerConfig }) {
  const clients = getKnodiaClients();
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description: "API for communicating with other Knodes",
          title: "Knodia Api Gateway API",
          version: "1.0.0",
        },
        servers: [{ description: "Api Gateway API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "E-services routes",
            name: apiTags.eservice,
          },
        ],
      },
    },
    loggerConfig,
    makeApiProblem,
    serviceName: serviceName.ESERVICE_PROCESS,
  });

  app.register(healthRouter);
  app.register(eserviceRouter, {
    eserviceProcessClient: clients.eserviceProcessClient,
  });

  return app;
}

export function buildAppFromConfig(config: ApiGatewayConfig) {
  const app = buildApp({
    loggerConfig: config,
  });

  return app;
}
