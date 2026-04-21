import type { LoggerConfig } from "@knodia/logger/config";

import formBody from "@fastify/formbody";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";

import type { AuthorizationServerConfig } from "./config/config.ts";

import { getK2K2GatewayApiClient } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { tokenRouter } from "./routers/tokenRouter.ts";
import { tokenServiceBuilder } from "./services/tokenService.ts";

export function buildApp({
  clientAssertionAcceptedAudiences,
  clientAssertionClockToleranceSeconds,
  clientAssertionMaxTokenAgeSeconds,
  config,
  knodeUrl,
}: {
  clientAssertionAcceptedAudiences: string[];
  clientAssertionClockToleranceSeconds: number;
  clientAssertionMaxTokenAgeSeconds: number;
  config: LoggerConfig;
  knodeUrl: string;
}) {
  const k2kGatewayClient = getK2K2GatewayApiClient({
    knodeUrl,
  });

  const app = createFastifyApp({
    fastifyOptions: {
      openapi: {
        info: {
          description:
            "API for issuing access tokens to consume E-services exposed by a Knode",
          title: "Knodia Authorization Server API",
          version: "1.0.0",
        },
        servers: [{ description: "Authorization Server API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Token routes",
            name: apiTags.token,
          },
        ],
      },
    },
    loggerConfig: config,
    makeApiProblem,
  });

  app.removeAllContentTypeParsers();
  app.register(formBody);
  app.register(healthRouter);
  app.register(tokenRouter, {
    clientAssertionAcceptedAudiences,
    clientAssertionClockToleranceSeconds,
    clientAssertionMaxTokenAgeSeconds,
    tokenService: tokenServiceBuilder(k2kGatewayClient),
  });

  return app;
}

export function buildAppFromConfig(config: AuthorizationServerConfig) {
  return buildApp({
    clientAssertionAcceptedAudiences: config.clientAssertionAcceptedAudiences,
    clientAssertionClockToleranceSeconds:
      config.clientAssertionClockToleranceSeconds,
    clientAssertionMaxTokenAgeSeconds: config.clientAssertionMaxTokenAgeSeconds,
    config,
    knodeUrl: config.knodeUrl,
  });
}
