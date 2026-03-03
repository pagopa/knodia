import { authenticationPlugin } from "@knodia/fastify-zod-api-commons/auth";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";

import { getK2K2GatewayApiClient } from "./clients/clientsProvider.ts";
import { type RemoteResourcesManagerConfig } from "./config/config.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { agreementRouter } from "./routers/agreementRouter.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { agreementServiceBuilder } from "./services/agreementService.ts";
import { eserviceServiceBuilder } from "./services/eserviceService.ts";

export function buildAppFromConfig(config: RemoteResourcesManagerConfig) {
  const app = buildApp({
    config,
  });

  return app;
}

function buildApp({ config }: { config: RemoteResourcesManagerConfig }) {
  const k2kGatewayClient = getK2K2GatewayApiClient({
    knodeUrl: config.knodeUrl,
  });
  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description: "Knodia remote-resources-manager API",
          title: "Knodia Remote Resources Manager API",
          version: "1.0.0",
        },
        servers: [{ description: "Remote Resources Manager API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Routes related to Agreements",
            name: apiTags.agreement,
          },
          {
            description: "Routes related to E-services",
            name: apiTags.eservice,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
    serviceName: "remote-resources-manager",
  });

  app.register(authenticationPlugin, config);
  app.register(healthRouter);
  app.register(eserviceRouter, {
    eserviceService: eserviceServiceBuilder(k2kGatewayClient),
  });
  app.register(agreementRouter, {
    agreementService: agreementServiceBuilder(k2kGatewayClient),
  });

  return app;
}
