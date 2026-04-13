import { type DynamoDBClient } from "@aws-sdk/client-dynamodb";
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
import { userRouter } from "./routers/keychain/userRouter.ts";
import { purposeConsumerRouter } from "./routers/purpose/purposeConsumerRouter.ts";
import { purposeProducerRouter } from "./routers/purpose/purposeProducerRouter.ts";
import { sessionRouter } from "./routers/sessionRouter.ts";
import { authServiceBuilder } from "./services/authService.ts";
import { createRefreshTokenStore } from "./services/refreshTokenStore.ts";

export function buildAppFromConfig(
  config: BffProcessConfig,
  dynamoClient?: DynamoDBClient,
) {
  const clients = getKnodiaClients({
    agreementProcessUrl: config.agreementProcessUrl,
    eserviceProcessUrl: config.eserviceProcessUrl,
    keychainProcessUrl: config.keychainProcessUrl,
    organizationProcessUrl: config.organizationProcessUrl,
    purposeProcessUrl: config.purposeProcessUrl,
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
          {
            description: "User routes",
            name: apiTags.user,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
  });

  const pollingService = pollingServiceBuilder(config);
  const refreshTokenStore = createRefreshTokenStore(
    config.dynamoDbRefreshTokensTable,
    dynamoClient,
  );
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
      agreementProcessClient: clients.agreementProcessClient,
      config,
      eserviceProcessClient: clients.eserviceProcessClient,
      fileManager,
      pollingService,
      purposeProcessClient: clients.purposeProcessClient,
    });
    protectedApp.register(consumerKeychainRouter, {
      keychainProcessClient: clients.keychainProcessClient,
      pollingService,
    });
    protectedApp.register(userRouter, {
      keychainProcessClient: clients.keychainProcessClient,
    });
    protectedApp.register(eserviceConsumerRouter, {
      config,
      organizationProcessClient: clients.organizationProcessClient,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(agreementConsumerRouter, {
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(purposeConsumerRouter, {
      config,
      keychainProcessClient: clients.keychainProcessClient,
      knodeId: config.knodeId,
      organizationProcessClient: clients.organizationProcessClient,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(sessionRouter, {
      knodeId: config.knodeId,
      organizationProcessClient: clients.organizationProcessClient,
    });
    protectedApp.register(agreementProducerRouter, {
      agreementProcessClient: clients.agreementProcessClient,
      eserviceProcessClient: clients.eserviceProcessClient,
      knodeId: config.knodeId,
      organizationProcessClient: clients.organizationProcessClient,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(purposeProducerRouter, {
      agreementProcessClient: clients.agreementProcessClient,
      eserviceProcessClient: clients.eserviceProcessClient,
      knodeId: config.knodeId,
      organizationProcessClient: clients.organizationProcessClient,
      purposeProcessClient: clients.purposeProcessClient,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
  });

  app.addHook("onClose", () => refreshTokenStore.close());
  return app;
}
