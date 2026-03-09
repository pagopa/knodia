import cookie from "@fastify/cookie";
import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { initFileManager } from "@knodia/file-manager";
import { tokenGeneratorBuilder } from "@knodia/token-generator";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { type BffProcessConfig } from "./config/config.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { authRouter } from "./routers/authRouter.ts";
import { eserviceConsumerRouter } from "./routers/eservice/eserviceConsumerRouter.ts";
import { eserviceProducerRouter } from "./routers/eservice/eserviceProducerRouter.ts";
import { authServiceBuilder } from "./services/authService.ts";
import { createRefreshTokenStore } from "./services/refreshTokenStore.ts";

export function buildAppFromConfig(config: BffProcessConfig) {
  const clients = getKnodiaClients({
    eserviceProcessUrl: config.eserviceProcessUrl,
    remoteResourcesManagerUrl: config.remoteResourcesManagerUrl,
  });

  const fileManager = initFileManager();
  const tokenGenerator = tokenGeneratorBuilder();
  const refreshTokenStore = createRefreshTokenStore(config.redisUrl);
  const authService = authServiceBuilder(tokenGenerator, refreshTokenStore);

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
    serviceName: "backend-for-frontend",
  });

  // Register cookie parser
  app.register(cookie);

  // Public routes (no JWT required)
  app.register(healthRouter);
  app.register(authRouter, { authService, config });

  // Protected routes — authenticationPlugin hook is scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(eserviceProducerRouter, {
      eserviceProcessClient: clients.eserviceProcessClient,
      fileManager,
    });
    protectedApp.register(eserviceConsumerRouter, {
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
  });

  return app;
}
