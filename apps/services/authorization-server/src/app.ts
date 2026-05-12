import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { type DynamoDBClient } from "@aws-sdk/client-dynamodb";
import formBody from "@fastify/formbody";
import { createJtiReplayStore } from "@knodia/db-jti-replay-store";
import { makeReadmodelDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { tokenGeneratorBuilder } from "@knodia/token-generator";

import type { AuthorizationServerConfig } from "./config/config.ts";

import {
  getK2K2GatewayApiClient,
  getKnodeApiKeychainK2K2GatewayApiClient,
} from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { knodeApiTokenRouter } from "./routers/knodeApiTokenRouter.ts";
import { tokenRouter } from "./routers/tokenRouter.ts";
import { knodeApiTokenServiceBuilder } from "./services/knodeApiTokenService.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";
import { tokenServiceBuilder } from "./services/tokenService.ts";

export function buildApp({
  config,
  dynamoClient,
  readmodelDb,
}: {
  config: AuthorizationServerConfig;
  dynamoClient?: DynamoDBClient;
  readmodelDb: NodePgDatabase;
}) {
  const k2kGatewayClient = getK2K2GatewayApiClient({
    consumerKnodeUrl: config.consumerKnodeUrl,
  });
  const knodeApiKeychainK2KGatewayClient =
    getKnodeApiKeychainK2K2GatewayApiClient({
      knodeApiKeychainKnodeUrl: config.knodeApiKeychainKnodeUrl,
    });
  const tokenGenerator = tokenGeneratorBuilder();

  const dpopProofStore = createJtiReplayStore(
    config.dynamoDbDpopProofsTable,
    dynamoClient,
  );

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
    config,
    tokenService: tokenServiceBuilder({
      config,
      dpopProofStore,
      k2kGatewayClient,
      readmodelService: readmodelServiceBuilder(readmodelDb),
      tokenGenerator,
    }),
  });
  app.register(knodeApiTokenRouter, {
    config,
    knodeApiTokenService: knodeApiTokenServiceBuilder({
      config,
      knodeApiKeychainK2KGatewayClient,
      tokenGenerator,
    }),
  });

  app.addHook("onClose", async () => {
    await dpopProofStore.close();
  });

  return app;
}

export function buildAppFromConfig(config: AuthorizationServerConfig) {
  const { db: readmodelDb, pool: readmodelPool } =
    makeReadmodelDrizzleConnection(config);

  const app = buildApp({
    config,
    readmodelDb,
  });

  app.addHook("onClose", async () => {
    await readmodelPool.end();
  });

  return app;
}
