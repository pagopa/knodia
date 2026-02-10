import type { LoggerConfig } from "@knodia/logger/config";

import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { serviceName } from "@knodia/fastify-zod-api-commons/models";
import { initFileManager } from "@knodia/file-manager";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { type BffProcessConfig } from "./config/config.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { eserviceDetailRouter } from "./routers/eserviceDetailRouter.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

export function buildAppFromConfig(config: BffProcessConfig) {
  const app = buildApp({
    loggerConfig: config,
  });

  return app;
}

function buildApp({ loggerConfig }: { loggerConfig: LoggerConfig }) {
  const clients = getKnodiaClients();
  const fileManager = initFileManager();
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description: "Knodia backend-for-frontend API",
          title: "Knodia BFF API",
          version: "1.0.0",
        },
        servers: [{ description: "BFF API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "E-services routes",
            name: apiTags.eservice,
          },
        ],
      },
    },
    loggerConfig: loggerConfig,
    makeApiProblem,
    readCorrelationIdFromHeader: false,
    serviceName: serviceName.BACKEND_FOR_FRONTEND,
  });

  app.register(healthRouter);
  app.register(eserviceRouter, {
    eserviceProcessClient: clients.eserviceProcessClient,
    fileManager,
  });
  app.register(eserviceDetailRouter, {
    eserviceProcessClient: clients.eserviceProcessClient,
  });

  return app;
}
