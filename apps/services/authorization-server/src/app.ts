import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
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

import { getK2K2GatewayApiClient } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { tokenRouter } from "./routers/tokenRouter.ts";
import { readmodelServiceBuilder } from "./services/readmodelService.ts";
import { tokenServiceBuilder } from "./services/tokenService.ts";

export function buildApp({
  config,
  readmodelDb,
  sharedDynamoClient,
}: {
  config: AuthorizationServerConfig;
  readmodelDb: NodePgDatabase;
  sharedDynamoClient: DynamoDBClient;
}) {
  const k2kGatewayClient = getK2K2GatewayApiClient({
    consumerKnodeUrl: config.consumerKnodeUrl,
  });
  const tokenGenerator = tokenGeneratorBuilder();

  const dpopProofStore = createJtiReplayStore(
    config.dynamoDbDpopProofsTable,
    sharedDynamoClient,
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

  return app;
}

export function buildAppFromConfig(
  config: AuthorizationServerConfig,
  injectedDynamoClient?: DynamoDBClient,
) {
  const { db: readmodelDb, pool: readmodelPool } =
    makeReadmodelDrizzleConnection(config);

  // Single DynamoDBClient is shared by both JTI replay stores
  // (refresh tokens + magic-link tokens). If the caller injected a client
  // (tests), reuse it and leave lifecycle to the caller; otherwise create
  // one and destroy it in onClose.
  const sharedDynamoClient = injectedDynamoClient ?? new DynamoDBClient();

  const app = buildApp({
    config,
    readmodelDb,
    sharedDynamoClient,
  });

  app.addHook("onClose", async () => {
    await readmodelPool.end();

    // Only destroy the shared DynamoDBClient if we created it. When a client
    // is injected by the caller (tests), leave lifecycle to the caller.
    if (!injectedDynamoClient) {
      sharedDynamoClient.destroy();
    }
  });

  return app;
}
