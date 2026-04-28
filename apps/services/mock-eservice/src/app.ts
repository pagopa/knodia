import type { KnodeId } from "@knodia/common-models/ids";
import type { LoggerConfig } from "@knodia/logger/config";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { createJtiReplayStore } from "@knodia/db-jti-replay-store";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import {
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
  dpopAuthSecurity,
  dpopAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";
import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";
import { type OpenAPIV3 } from "openapi-types";

import type { MockEserviceConfig } from "./config/config.ts";

import { bearerAccessTokenAuthPlugin } from "./auth/bearerAccessTokenAuthPlugin.ts";
import { dpopAccessTokenAuthPlugin } from "./auth/dpopAccessTokenAuthPlugin.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { mockBearerRouter } from "./routers/mockBearerRouter.ts";
import { mockDpopRouter } from "./routers/mockDpopRouter.ts";

interface BaseOptions {
  acceptedAudiences: string[];
  config: LoggerConfig;
  expectedIssuer: string;
  jwksResolvers: JWTVerifyGetKey[];
  knodeId: KnodeId;
}

interface DpopOptions {
  dpopProofHtuBaseUrl: string;
  dpopProofMaxTokenAgeSeconds: number;
  dynamoDbDpopProofsTable: string;
  sharedDynamoClient: DynamoDBClient;
}

export function buildApp({
  acceptedAudiences,
  config,
  dpopProofHtuBaseUrl,
  dpopProofMaxTokenAgeSeconds,
  dynamoDbDpopProofsTable,
  expectedIssuer,
  jwksResolvers,
  knodeId,
  sharedDynamoClient,
}: BaseOptions & DpopOptions) {
  const dpopProofStore = createJtiReplayStore(
    dynamoDbDpopProofsTable,
    sharedDynamoClient,
  );

  const app = createMockFastifyApp(
    config,
    { ...bearerAuthSecurityScheme, ...dpopAuthSecurityScheme },
    [...bearerAuthSecurity, ...dpopAuthSecurity],
  );

  // Public routes (no auth required)
  app.register(healthRouter);

  // Protected routes — accessTokenAuthPlugin is scoped to this context only.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockBearerRouter, { knodeId });
  });

  // DPoP-protected routes — dpopAccessTokenAuthPlugin is scoped to this context only.
  app.register(async (protectedApp) => {
    protectedApp.register(dpopAccessTokenAuthPlugin, {
      acceptedAudiences,
      dpopProofHtuBaseUrl,
      dpopProofMaxTokenAgeSeconds,
      dpopProofStore,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockDpopRouter, { knodeId });
  });

  return app;
}

export function buildAppFromConfig(
  config: MockEserviceConfig,
  injectedDynamoClient?: DynamoDBClient,
) {
  const sharedDynamoClient = injectedDynamoClient ?? new DynamoDBClient();

  return buildApp({
    acceptedAudiences: config.acceptedAudiences,
    config,
    dpopProofHtuBaseUrl: config.dpopProofHtuBaseUrl,
    dpopProofMaxTokenAgeSeconds: config.dpopProofMaxTokenAgeSeconds,
    dynamoDbDpopProofsTable: config.dynamoDbDpopProofsTable,
    expectedIssuer: config.expectedIssuer,
    jwksResolvers: resolveJwksResolvers(config),
    knodeId: config.knodeId,
    sharedDynamoClient,
  });
}

export function buildBearerAppFromConfig(config: MockEserviceConfig) {
  return buildBearerApp({
    acceptedAudiences: config.acceptedAudiences,
    config,
    expectedIssuer: config.expectedIssuer,
    jwksResolvers: resolveJwksResolvers(config),
    knodeId: config.knodeId,
  });
}

export function buildDpopAppFromConfig(
  config: MockEserviceConfig,
  injectedDynamoClient?: DynamoDBClient,
) {
  const sharedDynamoClient = injectedDynamoClient ?? new DynamoDBClient();

  return buildDpopApp({
    acceptedAudiences: config.acceptedAudiences,
    config,
    dpopProofHtuBaseUrl: config.dpopProofHtuBaseUrl,
    dpopProofMaxTokenAgeSeconds: config.dpopProofMaxTokenAgeSeconds,
    dynamoDbDpopProofsTable: config.dynamoDbDpopProofsTable,
    expectedIssuer: config.expectedIssuer,
    jwksResolvers: resolveJwksResolvers(config),
    knodeId: config.knodeId,
    sharedDynamoClient,
  });
}

function buildBearerApp({
  acceptedAudiences,
  config,
  expectedIssuer,
  jwksResolvers,
  knodeId,
}: BaseOptions) {
  const app = createMockFastifyApp(
    config,
    bearerAuthSecurityScheme,
    bearerAuthSecurity,
  );

  app.register(healthRouter);

  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockBearerRouter, { knodeId });
  });

  return app;
}

function buildDpopApp({
  acceptedAudiences,
  config,
  dpopProofHtuBaseUrl,
  dpopProofMaxTokenAgeSeconds,
  dynamoDbDpopProofsTable,
  expectedIssuer,
  jwksResolvers,
  knodeId,
  sharedDynamoClient,
}: BaseOptions & DpopOptions) {
  const dpopProofStore = createJtiReplayStore(
    dynamoDbDpopProofsTable,
    sharedDynamoClient,
  );

  const app = createMockFastifyApp(
    config,
    dpopAuthSecurityScheme,
    dpopAuthSecurity,
  );

  app.register(healthRouter);

  app.register(async (protectedApp) => {
    protectedApp.register(dpopAccessTokenAuthPlugin, {
      acceptedAudiences,
      dpopProofHtuBaseUrl,
      dpopProofMaxTokenAgeSeconds,
      dpopProofStore,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockDpopRouter, { knodeId });
  });

  return app;
}

function createMockFastifyApp(
  loggerConfig: LoggerConfig,
  securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>,
  security: OpenAPIV3.SecurityRequirementObject[],
) {
  return createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes },
        info: {
          description: "Mock e-service API endpoints",
          title: "Knodia Mock E-service API",
          version: "1.0.0",
        },
        security,
        servers: [{ description: "Mock E-service API", url: "/" }],
        tags: [
          healthRouterTag,
          {
            description: "Mock e-service data routes",
            name: apiTags.mock,
          },
        ],
      },
    },
    loggerConfig,
    makeApiProblem,
  });
}

function resolveJwksResolvers(config: MockEserviceConfig): JWTVerifyGetKey[] {
  return config.wellKnownUrls.map((url) => createRemoteJWKSet(new URL(url)));
}
