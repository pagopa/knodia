import type { LoggerConfig } from "@knodia/logger/config";

import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { initFileManager } from "@knodia/file-manager";
import { refreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";

import type { K2KGatewayConfig } from "./config/config.ts";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

export function buildAppFromConfig(config: K2KGatewayConfig) {
  const app = buildApp({
    eserviceInterfacesS3Bucket: config.eserviceInterfacesS3Bucket,
    eserviceProcessUrl: config.eserviceProcessUrl,
    internalJwt: config.internalJwt,
    loggerConfig: config,
  });

  return app;
}

function buildApp({
  eserviceInterfacesS3Bucket,
  eserviceProcessUrl,
  internalJwt,
  loggerConfig,
}: {
  eserviceInterfacesS3Bucket: string;
  eserviceProcessUrl: string;
  internalJwt: K2KGatewayConfig["internalJwt"];
  loggerConfig: LoggerConfig;
}) {
  const clients = getKnodiaClients({ eserviceProcessUrl });
  const fileManager = initFileManager();
  const tokenProvider = refreshableInternalTokenGenerator(internalJwt);
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
          {
            description: "Routes related to E-services",
            name: apiTags.eservice,
          },
        ],
      },
    },
    loggerConfig,
    makeApiProblem,
    serviceName: "k2k-gateway",
  });

  app.register(healthRouter);
  app.register(eserviceRouter, {
    eserviceInterfacesS3Bucket,
    eserviceProcessClient: clients.eserviceProcessClient,
    fileManager,
    tokenProvider,
  });

  return app;
}
