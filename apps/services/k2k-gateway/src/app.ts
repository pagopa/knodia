import type { LoggerConfig } from "@knodia/logger/config";

import { type KnodeId } from "@knodia/common-models/ids";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { initFileManager } from "@knodia/file-manager";
import { type PollingService, pollingServiceBuilder } from "@knodia/polling";
import { refreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { type K2KGatewayConfig } from "./config/config.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { agreementRouter } from "./routers/agreementRouter.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { organizationRouter } from "./routers/organizationRouter.ts";
import { purposeRouter } from "./routers/purposeRouter.ts";

export function buildAppFromConfig(config: K2KGatewayConfig) {
  const app = buildApp({
    agreementProcessUrl: config.agreementProcessUrl,
    callerKnodeId: config.callerKnodeId,
    eserviceProcessUrl: config.eserviceProcessUrl,
    internalJwt: config.internalJwt,
    loggerConfig: config,
    organizationProcessUrl: config.organizationProcessUrl,
    pollingService: pollingServiceBuilder(config),
    purposeProcessUrl: config.purposeProcessUrl,
  });

  return app;
}

function buildApp({
  agreementProcessUrl,
  callerKnodeId,
  eserviceProcessUrl,
  internalJwt,
  loggerConfig,
  organizationProcessUrl,
  pollingService,
  purposeProcessUrl,
}: {
  agreementProcessUrl: string;
  callerKnodeId: KnodeId;
  eserviceProcessUrl: string;
  internalJwt: K2KGatewayConfig["internalJwt"];
  loggerConfig: LoggerConfig;
  organizationProcessUrl: string;
  pollingService: PollingService;
  purposeProcessUrl: string;
}) {
  const clients = getKnodiaClients({
    agreementProcessUrl,
    eserviceProcessUrl,
    organizationProcessUrl,
    purposeProcessUrl,
  });
  const fileManager = initFileManager();
  const tokenProvider = refreshableInternalTokenGenerator(internalJwt);

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
    serviceName: "k2k-gateway",
  });

  app.register(healthRouter);
  app.register(eserviceRouter, {
    eserviceProcessClient: clients.eserviceProcessClient,
    fileManager,
    tokenProvider,
  });
  app.register(agreementRouter, {
    agreementProcessClient: clients.agreementProcessClient,
    callerKnodeId,
    pollingService,
    tokenProvider,
  });
  app.register(organizationRouter, {
    organizationProcessClient: clients.organizationProcessClient,
    tokenProvider,
  });
  app.register(purposeRouter, {
    callerKnodeId,
    pollingService,
    purposeProcessClient: clients.purposeProcessClient,
    tokenProvider,
  });

  return app;
}
