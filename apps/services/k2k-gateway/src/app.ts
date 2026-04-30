import type { LoggerConfig } from "@knodia/logger/config";

import { type KnodeId } from "@knodia/common-models/ids";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { initFileManager } from "@knodia/file-manager";
import { type PollingService, pollingServiceBuilder } from "@knodia/polling";
import { tokenGeneratorBuilder } from "@knodia/token-generator";
import { refreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";

import type { K2KGatewayConfig } from "./config/config.ts";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { agreementRouter } from "./routers/agreementRouter.ts";
import { clientAssertionRouter } from "./routers/clientAssertionRouter.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { organizationRouter } from "./routers/organizationRouter.ts";
import { purposeRouter } from "./routers/purposeRouter.ts";

export function buildApp({
  agreementProcessUrl,
  callerKnodeId,
  eserviceInterfacesS3Bucket,
  eserviceProcessUrl,
  internalJwt,
  keychainProcessUrl,
  loggerConfig,
  magicLinkConfig,
  organizationProcessUrl,
  pollingService,
  purposeProcessUrl,
}: {
  agreementProcessUrl: string;
  callerKnodeId: KnodeId;
  eserviceInterfacesS3Bucket: string;
  eserviceProcessUrl: string;
  internalJwt: K2KGatewayConfig["internalJwt"];
  keychainProcessUrl: string;
  loggerConfig: LoggerConfig;
  magicLinkConfig: K2KGatewayConfig["magicLinkConfig"];
  organizationProcessUrl: string;
  pollingService: PollingService;
  purposeProcessUrl: string;
}) {
  const clients = getKnodiaClients({
    agreementProcessUrl,
    eserviceProcessUrl,
    keychainProcessUrl,
    organizationProcessUrl,
    purposeProcessUrl,
  });
  const fileManager = initFileManager();
  const tokenGenerator = tokenGeneratorBuilder();
  const internalTokenProvider = refreshableInternalTokenGenerator(
    internalJwt,
    tokenGenerator,
  );

  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description: "API for communicating with a Knode",
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
            description: "Routes related to Agreements",
            name: apiTags.agreement,
          },
          {
            description: "Routes related to E-services",
            name: apiTags.eservice,
          },
          {
            description: "Routes related to Organizations",
            name: apiTags.organization,
          },
          {
            description: "Routes related to Purposes",
            name: apiTags.purpose,
          },
        ],
      },
    },
    loggerConfig,
    makeApiProblem,
  });

  app.register(healthRouter);
  app.register(clientAssertionRouter, {
    callerKnodeId,
    keychainProcessClient: clients.keychainProcessClient,
    organizationProcessClient: clients.organizationProcessClient,
    tokenProvider: internalTokenProvider,
  });
  app.register(eserviceRouter, {
    eserviceInterfacesS3Bucket,
    eserviceProcessClient: clients.eserviceProcessClient,
    fileManager,
    tokenProvider: internalTokenProvider,
  });
  app.register(agreementRouter, {
    agreementProcessClient: clients.agreementProcessClient,
    callerKnodeId,
    internalTokenProvider,
    magicLinkConfig,
    pollingService,
    tokenGenerator,
  });
  app.register(organizationRouter, {
    organizationProcessClient: clients.organizationProcessClient,
    tokenProvider: internalTokenProvider,
  });
  app.register(purposeRouter, {
    callerKnodeId,
    pollingService,
    purposeProcessClient: clients.purposeProcessClient,
    tokenProvider: internalTokenProvider,
  });

  return app;
}

export function buildAppFromConfig(config: K2KGatewayConfig) {
  const app = buildApp({
    agreementProcessUrl: config.agreementProcessUrl,
    callerKnodeId: config.callerKnodeId,
    eserviceInterfacesS3Bucket: config.eserviceInterfacesS3Bucket,
    eserviceProcessUrl: config.eserviceProcessUrl,
    internalJwt: config.internalJwt,
    keychainProcessUrl: config.keychainProcessUrl,
    loggerConfig: config,
    magicLinkConfig: config.magicLinkConfig,
    organizationProcessUrl: config.organizationProcessUrl,
    pollingService: pollingServiceBuilder(config),
    purposeProcessUrl: config.purposeProcessUrl,
  });

  return app;
}
