import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
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
import { eserviceConsumerRouter } from "./routers/eservice/eserviceConsumerRouter.ts";
import { eserviceProducerRouter } from "./routers/eservice/eserviceProducerRouter.ts";

export function buildAppFromConfig(config: BffProcessConfig) {
  return buildApp({ config });
}

function buildApp({ config }: { config: BffProcessConfig }) {
  const clients = getKnodiaClients({
    eserviceProcessUrl: config.eserviceProcessUrl,
    remoteResourcesManagerUrl: config.remoteResourcesManagerUrl,
  });
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
    loggerConfig: config,
    makeApiProblem,
    readCorrelationIdFromHeader: false,
    serviceName: serviceName.BACKEND_FOR_FRONTEND,
  });

  app.register(authenticationPlugin, config);
  app.register(healthRouter);
  app.register(eserviceProducerRouter, {
    eserviceProcessClient: clients.eserviceProcessClient,
    fileManager,
  });
  app.register(eserviceConsumerRouter, {
    remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
  });

  return app;
}
