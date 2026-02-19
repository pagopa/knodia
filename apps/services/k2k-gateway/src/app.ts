import type { LoggerConfig } from "@knodia/logger/config";

import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { serviceName } from "@knodia/fastify-zod-api-commons/models";

import type { K2KGatewayConfig } from "./config/config.ts";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

export function buildAppFromConfig(config: K2KGatewayConfig) {
  const app = buildApp({
    eserviceProcessUrl: config.eserviceProcessUrl,
    loggerConfig: config,
  });

  return app;
}

function buildApp({
  eserviceProcessUrl,
  loggerConfig,
}: {
  eserviceProcessUrl: string;
  loggerConfig: LoggerConfig;
}) {
  const clients = getKnodiaClients({ eserviceProcessUrl });
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description: "API for communicating with other Knodes",
          title: "Knode to Knode API",
          version: "1.0.0",
        },
        servers: [{ description: "Knode to Knode API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description:
              "Routes to access resources following RESTful conventions",
            name: apiTags.resource,
          },
          {
            description: "Ad-hoc routes to simplify frequent use cases",
            name: apiTags.operation,
          },
        ],
      },
    },
    loggerConfig,
    makeApiProblem,
    readCorrelationIdFromHeader: false,
    serviceName: serviceName.K2K_GATEWAY,
  });

  app.register(healthRouter);
  app.register(eserviceRouter, {
    eserviceProcessClient: clients.eserviceProcessClient,
  });

  return app;
}
