import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { initFileManager } from "@knodia/file-manager";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { type BffProcessConfig } from "./config/config.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { authRouter } from "./routers/authorizationRouter.ts";
import { eserviceConsumerRouter } from "./routers/eservice/eserviceConsumerRouter.ts";
import { eserviceProducerRouter } from "./routers/eservice/eserviceProducerRouter.ts";
import {
  authorizationServiceBuilder,
  makeKmsClient,
} from "./services/authorizationService.ts";

export function buildAppFromConfig(config: BffProcessConfig) {
  return buildApp({ config });
}

function buildApp({ config }: { config: BffProcessConfig }) {
  const clients = getKnodiaClients({
    eserviceProcessUrl: config.eserviceProcessUrl,
    remoteResourcesManagerUrl: config.remoteResourcesManagerUrl,
  });
  const fileManager = initFileManager();
  const kmsClient = makeKmsClient();
  const tokenService = authorizationServiceBuilder(kmsClient);
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
            description: "Authentication routes",
            name: apiTags.auth,
          },
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
    serviceName: "backend-for-frontend",
  });

  app.register(authenticationPlugin, config);
  app.register(healthRouter);
  app.register(authRouter, { authorizationService: tokenService });
  app.register(eserviceProducerRouter, {
    eserviceProcessClient: clients.eserviceProcessClient,
    fileManager,
  });
  app.register(eserviceConsumerRouter, {
    remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
  });

  return app;
}
