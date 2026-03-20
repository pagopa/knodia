import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { initFileManager } from "@knodia/file-manager";
import { pollingServiceBuilder } from "@knodia/polling";
import { refreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";

import type { K2KGatewayConfig } from "./config/config.ts";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { agreementRouter } from "./routers/agreementRouter.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { organizationRouter } from "./routers/organizationRouter.ts";
import { purposeRouter } from "./routers/purposeRouter.ts";

export function buildAppFromConfig(config: K2KGatewayConfig) {
  return buildApp({ config });
}

function buildApp({ config }: { config: K2KGatewayConfig }) {
  const clients = getKnodiaClients({
    agreementProcessUrl: config.agreementProcessUrl,
    eserviceProcessUrl: config.eserviceProcessUrl,
    organizationProcessUrl: config.organizationProcessUrl,
    purposeProcessUrl: config.purposeProcessUrl,
  });
  const fileManager = initFileManager();
  const tokenProvider = refreshableInternalTokenGenerator(config.internalJwt);
  const pollingService = pollingServiceBuilder(config);
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
    loggerConfig: config,
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
    callerKnodeId: config.callerKnodeId,
    tokenProvider,
  });
  app.register(organizationRouter, {
    organizationProcessClient: clients.organizationProcessClient,
    tokenProvider,
  });
  app.register(purposeRouter, {
    callerKnodeId: config.callerKnodeId,
    pollingService,
    purposeProcessClient: clients.purposeProcessClient,
    tokenProvider,
  });

  return app;
}
