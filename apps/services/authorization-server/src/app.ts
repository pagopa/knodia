import type { KnodeId } from "@knodia/common-models/ids";
import type { LoggerConfig } from "@knodia/logger/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import formBody from "@fastify/formbody";
import { makeReadmodelDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { tokenGeneratorBuilder } from "@knodia/token-generator";

import type { AuthorizationServerConfig } from "./config/config.ts";

import { getK2K2GatewayApiClient } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { tokenRouter } from "./routers/tokenRouter.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";
import { tokenServiceBuilder } from "./services/tokenService.ts";

export function buildApp({
  clientAssertionAcceptedAudiences,
  clientAssertionClockToleranceSeconds,
  clientAssertionMaxTokenAgeSeconds,
  config,
  consumerKnodeUrl,
  eserviceAccessTokenJwtKid,
  generatedEserviceAccessTokenIssuer,
  knodeId,
  readmodelDb,
}: {
  clientAssertionAcceptedAudiences: string[];
  clientAssertionClockToleranceSeconds: number;
  clientAssertionMaxTokenAgeSeconds: number;
  config: LoggerConfig;
  consumerKnodeUrl: string;
  eserviceAccessTokenJwtKid: string;
  generatedEserviceAccessTokenIssuer: string;
  knodeId: KnodeId;
  readmodelDb: NodePgDatabase;
}) {
  const k2kGatewayClient = getK2K2GatewayApiClient({
    consumerKnodeUrl,
  });
  const tokenGenerator = tokenGeneratorBuilder();

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
    tokenService: tokenServiceBuilder({
      eserviceAccessTokenJwtKid,
      generatedEserviceAccessTokenIssuer,
      k2kGatewayClient,
      knodeId,
      readmodelService: readmodelServiceBuilder(readmodelDb),
      tokenGenerator,
    }),
  });

  return app;
}

export function buildAppFromConfig(config: AuthorizationServerConfig) {
  const { db: readmodelDb, pool: readmodelPool } =
    makeReadmodelDrizzleConnection(config);

  const app = buildApp({
    clientAssertionAcceptedAudiences: config.clientAssertionAcceptedAudiences,
    clientAssertionClockToleranceSeconds:
      config.clientAssertionClockToleranceSeconds,
    clientAssertionMaxTokenAgeSeconds: config.clientAssertionMaxTokenAgeSeconds,
    config,
    consumerKnodeUrl: config.consumerKnodeUrl,
    eserviceAccessTokenJwtKid: config.eserviceAccessTokenJwtKid,
    generatedEserviceAccessTokenIssuer:
      config.generatedEserviceAccessTokenIssuer,
    knodeId: config.knodeId,
    readmodelDb,
  });

  app.addHook("onClose", async () => {
    await readmodelPool.end();
  });

  return app;
}
