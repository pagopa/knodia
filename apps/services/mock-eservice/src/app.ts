import type { LoggerConfig } from "@knodia/logger/config";
import type { OpenAPIV3 } from "openapi-types";

import { type DynamoDBClient } from "@aws-sdk/client-dynamodb";
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

import type { MockEserviceConfig } from "./config/config.ts";

import { bearerAccessTokenAuthPlugin } from "./auth/bearerAccessTokenAuthPlugin.ts";
import { dpopAccessTokenAuthPlugin } from "./auth/dpopAccessTokenAuthPlugin.ts";
import { assertRotatingFiscalCodesAreInSync } from "./data/naturalPersons.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { mockBearerRouter } from "./routers/mockBearerRouter.ts";
import { mockDpopRouter } from "./routers/mockDpopRouter.ts";
import { mockSignalHubRouter } from "./routers/mockSignalHubRouter.ts";

const bearerAppTag: OpenAPIV3.TagObject = {
  description:
    "Personal information lookup by Codice Fiscale (Cross-Border E-Service 01, Bearer-protected)",
  name: apiTags.personalInformation,
};
const dpopAppTag: OpenAPIV3.TagObject = {
  description:
    "Digital contact lookup by Codice Fiscale (Cross-Border E-Service 02, DPoP-protected)",
  name: apiTags.digitalContact,
};
const signalHubAppTag: OpenAPIV3.TagObject = {
  description:
    "Residence lookup + pseudonymization for Signal Hub (Cross-Border E-Service 03, Bearer-protected)",
  name: apiTags.residence,
};

export function buildApp({
  config,
  dynamoClient,
  jwksResolvers,
}: {
  config: MockEserviceConfig;
  dynamoClient?: DynamoDBClient;
  jwksResolvers: JWTVerifyGetKey[];
}) {
  assertRotatingFiscalCodesAreInSync();

  const {
    acceptedAudiences,
    dpopProofHtuBaseUrl,
    dpopProofMaxTokenAgeSeconds,
    dynamoDbDpopProofsTable,
    expectedIssuer,
    jwtClockToleranceSeconds,
    knodeId,
    seedExpireSeconds,
    seedSaltLength,
    seedStartDateMs,
  } = config;

  const seedConfig = {
    expireSeconds: seedExpireSeconds,
    saltLength: seedSaltLength,
    startDateMs: seedStartDateMs,
  };

  const dpopProofStore = createJtiReplayStore(
    dynamoDbDpopProofsTable,
    dynamoClient,
  );

  const app = createMockFastifyApp(
    config,
    { ...bearerAuthSecurityScheme, ...dpopAuthSecurityScheme },
    [...bearerAuthSecurity, ...dpopAuthSecurity],
    {
      description: "Mock e-service API endpoints",
      title: "Knodia Mock E-service API",
      version: "1.0.0",
    },
    [healthRouterTag, bearerAppTag, dpopAppTag, signalHubAppTag],
  );

  // Public routes (no auth required)
  app.register(healthRouter);

  // Bearer-protected routes — bearerAccessTokenAuthPlugin is scoped to this context only.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockBearerRouter, { knodeId });
    protectedApp.register(mockSignalHubRouter, { knodeId, seedConfig });
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
      jwtClockToleranceSeconds,
    });
    protectedApp.register(mockDpopRouter, { knodeId });
  });

  return app;
}

export function buildAppFromConfig(config: MockEserviceConfig) {
  return buildApp({
    config,
    jwksResolvers: resolveJwksResolvers(config),
  });
}

export function buildBearerAppFromConfig(config: MockEserviceConfig) {
  return buildBearerApp({
    config,
    jwksResolvers: resolveJwksResolvers(config),
  });
}

export function buildBearerSignalHubAppFromConfig(config: MockEserviceConfig) {
  return buildBearerSignalHubApp({
    config,
    jwksResolvers: resolveJwksResolvers(config),
  });
}

export function buildDpopAppFromConfig(config: MockEserviceConfig) {
  return buildDpopApp({
    config,
    jwksResolvers: resolveJwksResolvers(config),
  });
}

function buildBearerApp({
  config,
  jwksResolvers,
}: {
  config: MockEserviceConfig;
  jwksResolvers: JWTVerifyGetKey[];
}) {
  const { acceptedAudiences, expectedIssuer, knodeId } = config;

  const app = createMockFastifyApp(
    config,
    bearerAuthSecurityScheme,
    bearerAuthSecurity,
    {
      description: "Mock e-service API with Bearer token authentication",
      title: "Knodia Mock E-service API (Bearer)",
      version: "1.0.0",
    },
    [bearerAppTag],
  );

  // No health router: this app is only used for OpenAPI generation, where we don't want /status.
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

function buildBearerSignalHubApp({
  config,
  jwksResolvers,
}: {
  config: MockEserviceConfig;
  jwksResolvers: JWTVerifyGetKey[];
}) {
  const {
    acceptedAudiences,
    expectedIssuer,
    knodeId,
    seedExpireSeconds,
    seedSaltLength,
    seedStartDateMs,
  } = config;

  const seedConfig = {
    expireSeconds: seedExpireSeconds,
    saltLength: seedSaltLength,
    startDateMs: seedStartDateMs,
  };

  const app = createMockFastifyApp(
    config,
    bearerAuthSecurityScheme,
    bearerAuthSecurity,
    {
      description:
        "Mock e-service API for Signal Hub (residence + pseudonymization)",
      title: "Knodia Mock E-service API (Signal Hub)",
      version: "1.0.0",
    },
    [signalHubAppTag],
  );

  // No health router: this app is only used for OpenAPI generation, where we don't want /status.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockSignalHubRouter, { knodeId, seedConfig });
  });

  return app;
}

function buildDpopApp({
  config,
  dynamoClient,
  jwksResolvers,
}: {
  config: MockEserviceConfig;
  dynamoClient?: DynamoDBClient;
  jwksResolvers: JWTVerifyGetKey[];
}) {
  const {
    acceptedAudiences,
    dpopProofHtuBaseUrl,
    dpopProofMaxTokenAgeSeconds,
    dynamoDbDpopProofsTable,
    expectedIssuer,
    jwtClockToleranceSeconds,
    knodeId,
  } = config;

  const dpopProofStore = createJtiReplayStore(
    dynamoDbDpopProofsTable,
    dynamoClient,
  );

  const app = createMockFastifyApp(
    config,
    dpopAuthSecurityScheme,
    dpopAuthSecurity,
    {
      description:
        "Mock e-service API with DPoP-bound access token authentication",
      title: "Knodia Mock E-service API (DPoP)",
      version: "1.0.0",
    },
    [dpopAppTag],
  );

  // No health router: this app is only used for OpenAPI generation, where we don't want /status.
  app.register(async (protectedApp) => {
    protectedApp.register(dpopAccessTokenAuthPlugin, {
      acceptedAudiences,
      dpopProofHtuBaseUrl,
      dpopProofMaxTokenAgeSeconds,
      dpopProofStore,
      expectedIssuer,
      jwksResolvers,
      jwtClockToleranceSeconds,
    });
    protectedApp.register(mockDpopRouter, { knodeId });
  });

  return app;
}

function createMockFastifyApp(
  loggerConfig: LoggerConfig,
  securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>,
  security: OpenAPIV3.SecurityRequirementObject[],
  info: OpenAPIV3.InfoObject,
  tags: OpenAPIV3.TagObject[],
) {
  return createFastifyApp({
    fastifyOptions: {
      openapi: {
        components: { securitySchemes },
        info,
        security,
        servers: [{ description: "Mock E-service API", url: "/" }],
        tags,
      },
    },
    loggerConfig,
    makeApiProblem,
  });
}

function resolveJwksResolvers(config: MockEserviceConfig): JWTVerifyGetKey[] {
  return config.wellKnownUrls.map((url) => createRemoteJWKSet(new URL(url)));
}
