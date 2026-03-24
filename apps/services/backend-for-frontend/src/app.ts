import cookie from "@fastify/cookie";
import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import {
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";
import { initFileManager } from "@knodia/file-manager";
import { pollingServiceBuilder } from "@knodia/polling";
import { tokenGeneratorBuilder } from "@knodia/token-generator";

import type { BffProcessConfig } from "./config/config.ts";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { agreementConsumerRouter } from "./routers/agreement/agreementConsumerRouter.ts";
import { agreementProducerRouter } from "./routers/agreement/agreementProducerRouter.ts";
import { authRouter } from "./routers/authRouter.ts";
import { eserviceConsumerRouter } from "./routers/eservice/eserviceConsumerRouter.ts";
import { eserviceProducerRouter } from "./routers/eservice/eserviceProducerRouter.ts";
import { consumerKeychainRouter } from "./routers/keychain/consumerKeychainRouter.ts";
import { purposeConsumerRouter } from "./routers/purpose/purposeConsumerRouter.ts";
import { authServiceBuilder } from "./services/authService.ts";
import { createRefreshTokenStore } from "./services/refreshTokenStore.ts";


export function buildAppFromConfig(config: BffProcessConfig) {
  const clients = getKnodiaClients({
    agreementProcessUrl: config.agreementProcessUrl,
    eserviceProcessUrl: config.eserviceProcessUrl,
    keychainProcessUrl: config.keychainProcessUrl,
    organizationProcessUrl: config.organizationProcessUrl,
    remoteResourcesManagerUrl: config.remoteResourcesManagerUrl,
  });

  const fileManager = initFileManager();
  const tokenGenerator = tokenGeneratorBuilder();

  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes: bearerAuthSecurityScheme },
        info: {
          description: "Knodia backend-for-frontend API",
          title: "Knodia BFF API",
          version: "1.0.0",
        },
        security: bearerAuthSecurity,
        servers: [{ description: "BFF API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Authentication routes",
            name: apiTags.auth,
          },
          {
            description: "Agreements routes",
            name: apiTags.agreement,
          },
          {
            description: "E-services routes",
            name: apiTags.eservice,
          },
          {
            description: "Consumer Keychains routes",
            name: apiTags.consumerKeychain,
          },
          {
            description: "Purpose routes",
            name: apiTags.purpose,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
    serviceName: "backend-for-frontend",
  });

  const pollingService = pollingServiceBuilder(config);
  const refreshTokenStore = createRefreshTokenStore(config.redisUrl, app.log);
  const authService = authServiceBuilder(
    config,
    tokenGenerator,
    refreshTokenStore,
  );

  // Register cookie parser
  app.register(cookie);

  // Public routes (no JWT required)
  app.register(healthRouter);
  app.register(authRouter, { authService, cookieConfig: config.cookie });

  // Protected routes — authenticationPlugin hook is scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(eserviceProducerRouter, {
      config,
      eserviceProcessClient: clients.eserviceProcessClient,
      fileManager,
      pollingService,
    });
    protectedApp.register(consumerKeychainRouter, {
      keychainProcessClient: clients.keychainProcessClient,
      pollingService,
    });
    protectedApp.register(eserviceConsumerRouter, {
      config,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(agreementConsumerRouter, {
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(purposeConsumerRouter);
    protectedApp.register(agreementProducerRouter, {
      agreementProcessClient: clients.agreementProcessClient,
      eserviceProcessClient: clients.eserviceProcessClient,
      knodeId: config.knodeId,
      organizationProcessClient: clients.organizationProcessClient,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
  });

  app.addHook("onClose", () => refreshTokenStore.close());
  return app;
}
