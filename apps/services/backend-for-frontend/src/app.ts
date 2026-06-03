import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import cookie from "@fastify/cookie";
import { createJtiReplayStore } from "@knodia/db-jti-replay-store";
import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import {
  initRedisRateLimiter,
  type RateLimiter,
  rateLimitPlugin,
  rateLimitResponseHeadersPlugin,
} from "@knodia/fastify-zod-api-commons/rate-limit";
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
import { agreementExternalRouter } from "./routers/agreement/agreementExternalRouter.ts";
import { agreementProducerRouter } from "./routers/agreement/agreementProducerRouter.ts";
import { authRouter } from "./routers/authRouter.ts";
import { eserviceTemplateRouter } from "./routers/eservice-template/eserviceTemplateRouter.ts";
import { eserviceConsumerRouter } from "./routers/eservice/eserviceConsumerRouter.ts";
import { eserviceProducerRouter } from "./routers/eservice/eserviceProducerRouter.ts";
import { consumerKeychainRouter } from "./routers/keychain/consumerKeychainRouter.ts";
import { knodeApiKeychainRouter } from "./routers/keychain/knodeApiKeychainRouter.ts";
import { producerKeychainRouter } from "./routers/keychain/producerKeychainRouter.ts";
import { operatorRouter } from "./routers/operatorRouter.ts";
import { purposeTemplateRouter } from "./routers/purpose-template/purposeTemplateRouter.ts";
import { purposeConsumerRouter } from "./routers/purpose/purposeConsumerRouter.ts";
import { purposeProducerRouter } from "./routers/purpose/purposeProducerRouter.ts";
import { sessionRouter } from "./routers/sessionRouter.ts";
import { authServiceBuilder } from "./services/authService.ts";

export function buildAppFromConfig(
  config: BffProcessConfig,
  injectedDynamoClient?: DynamoDBClient,
  rateLimiterOverride?: RateLimiter,
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
  const sharedDynamoClient = injectedDynamoClient ?? new DynamoDBClient();

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
            description: "Knode API Keychains routes",
            name: apiTags.knodeApiKeychain,
          },
          {
            description: "Producer Keychains routes",
            name: apiTags.producerKeychain,
          },
          {
            description: "Purpose routes",
            name: apiTags.purpose,
          },
          {
            description: "Operator routes",
            name: apiTags.operator,
          },
          {
            description: "E-service Templates routes",
            name: apiTags.eserviceTemplate,
          },
          {
            description: "Purpose Templates routes",
            name: apiTags.purposeTemplate,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
  });

  const pollingService = pollingServiceBuilder(config);
  const refreshTokenStore = createJtiReplayStore(
    config.dynamoDbRefreshTokensTable,
    sharedDynamoClient,
  );
  const magicLinkTokenStore = createJtiReplayStore(
    config.dynamoDbMagicLinkTokensTable,
    sharedDynamoClient,
  );
  const rateLimiter =
    rateLimiterOverride ??
    initRedisRateLimiter({
      config,
      knodeId: config.knodeId,
      logger: app.log,
      serviceName: "backend-for-frontend",
    });
  const authService = authServiceBuilder({
    config,
    magicLinkTokenStore,
    rateLimiter,
    refreshTokenStore,
    tokenGenerator,
  });

  app.register(cookie);
  app.register(rateLimitResponseHeadersPlugin);

  // /auth/* is rate-limited inline inside authService, post-credential check.
  // /auth/logout intentionally bypasses rate limiting.
  app.register(healthRouter);
  app.register(authRouter, {
    authCookieAllowedOrigins: config.authCookieAllowedOrigins,
    authService,
    cookieConfig: config.cookie,
  });

  // Protected routes — authenticationPlugin hook is scoped to this context only.
  // See https://fastify.dev/docs/latest/Reference/Encapsulation/
  app.register(async (protectedApp) => {
    protectedApp.register(authenticationPlugin, config);
    protectedApp.register(rateLimitPlugin, { rateLimiter });
    protectedApp.register(eserviceTemplateRouter);
    protectedApp.register(purposeTemplateRouter, {
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
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
      organizationProcessClient: clients.organizationProcessClient,
      pollingService,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(knodeApiKeychainRouter, {
      keychainProcessClient: clients.keychainProcessClient,
      organizationProcessClient: clients.organizationProcessClient,
      pollingService,
    });
    protectedApp.register(producerKeychainRouter, {
      eserviceProcessClient: clients.eserviceProcessClient,
      keychainProcessClient: clients.keychainProcessClient,
      organizationProcessClient: clients.organizationProcessClient,
      pollingService,
    });
    protectedApp.register(operatorRouter, {
      organizationProcessClient: clients.organizationProcessClient,
    });
    protectedApp.register(eserviceConsumerRouter, {
      config,
      keychainProcessClient: clients.keychainProcessClient,
      organizationProcessClient: clients.organizationProcessClient,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(agreementConsumerRouter, {
      config,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(purposeConsumerRouter, {
      config,
      keychainProcessClient: clients.keychainProcessClient,
      organizationProcessClient: clients.organizationProcessClient,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(sessionRouter, {
      knodeId: config.knodeId,
      organizationProcessClient: clients.organizationProcessClient,
    });
    protectedApp.register(agreementProducerRouter, {
      agreementProcessClient: clients.agreementProcessClient,
      config,
      eserviceProcessClient: clients.eserviceProcessClient,
      organizationProcessClient: clients.organizationProcessClient,
      pollingService,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(purposeProducerRouter, {
      agreementProcessClient: clients.agreementProcessClient,
      config,
      eserviceProcessClient: clients.eserviceProcessClient,
      organizationProcessClient: clients.organizationProcessClient,
      pollingService,
      purposeProcessClient: clients.purposeProcessClient,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
    protectedApp.register(agreementExternalRouter, {
      agreementProcessClient: clients.agreementProcessClient,
      config,
      eserviceProcessClient: clients.eserviceProcessClient,
      organizationProcessClient: clients.organizationProcessClient,
      pollingService,
      remoteResourcesManagerClient: clients.remoteResourcesManagerClient,
    });
  });

  app.addHook("onClose", async () => {
    sharedDynamoClient.destroy();
    await rateLimiter.disconnect();
  });

  return app;
}
