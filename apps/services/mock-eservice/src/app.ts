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
import { tokenGeneratorBuilder } from "@knodia/token-generator";
import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";

import type { MockEserviceConfig } from "./config/config.ts";

import { bearerAccessTokenAuthPlugin } from "./auth/bearerAccessTokenAuthPlugin.ts";
import { dpopAccessTokenAuthPlugin } from "./auth/dpopAccessTokenAuthPlugin.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { integrityRest02Plugin } from "./plugins/integrityRest02Plugin.ts";
import { mockBearerRouter } from "./routers/mockBearerRouter.ts";
import { mockDpopRouter } from "./routers/mockDpopRouter.ts";
import { mockIntegrityRest02Router } from "./routers/mockIntegrityRest02Router.ts";
import { mockPocUc02CompaniesRouter } from "./routers/mockPocUc02CompaniesRouter.ts";
import { mockSignalHubRouter } from "./routers/mockSignalHubRouter.ts";
import { toSignalHubSeedConfig } from "./signalHub/seedEnvConfig.ts";

const bearerAppTag: OpenAPIV3.TagObject = {
  description:
    "Personal information lookup by Codice Fiscale (Cross-Border E-service 01, Bearer-protected)",
  name: apiTags.personalInformation,
};
const dpopAppTag: OpenAPIV3.TagObject = {
  description:
    "Digital contact lookup by Codice Fiscale (Cross-Border E-service 02, DPoP-protected)",
  name: apiTags.digitalContact,
};
const signalHubAppTag: OpenAPIV3.TagObject = {
  description:
    "Residence lookup + pseudonymization for Signal Hub (Cross-Border E-service 03, Bearer-protected)",
  name: apiTags.residence,
};
const pocUc02CompaniesAppTag: OpenAPIV3.TagObject = {
  description:
    "Legal-entity information + evidences lookup by uid_company (Bearer-protected)",
  name: apiTags.pocUc02Companies,
};
const companyAddressAppTag: OpenAPIV3.TagObject = {
  description:
    "Legal-entity address lookup by uid_company (Cross-Border E-service 06, Bearer-protected)",
  name: apiTags.companyAddress,
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
  const {
    acceptedAudiences,
    dpopProofHtuBaseUrl,
    dpopProofMaxTokenAgeSeconds,
    dynamoDbDpopProofsTable,
    expectedIssuer,
    jwtClockToleranceSeconds,
    knodeId,
  } = config;

  const seedConfig = toSignalHubSeedConfig(config);

  const dpopProofStore = createJtiReplayStore(
    dynamoDbDpopProofsTable,
    dynamoClient,
  );

  const tokenGenerator = tokenGeneratorBuilder();

  const app = createMockFastifyApp(
    config,
    { ...bearerAuthSecurityScheme, ...dpopAuthSecurityScheme },
    [...bearerAuthSecurity, ...dpopAuthSecurity],
    {
      description: "Mock e-service API endpoints",
      title: "Knodia Mock E-service API",
      version: "1.0.0",
    },
    [
      healthRouterTag,
      bearerAppTag,
      dpopAppTag,
      signalHubAppTag,
      pocUc02CompaniesAppTag,
      companyAddressAppTag,
    ],
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
    protectedApp.register(mockPocUc02CompaniesRouter, { knodeId });
    protectedApp.register(async (integrityRest02App) => {
      integrityRest02App.register(integrityRest02Plugin, {
        integrityRest02Config: config,
        tokenGenerator,
      });
      integrityRest02App.register(mockIntegrityRest02Router, { knodeId });
    });
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

export function buildBearerIntegrityRest02AppFromConfig(
  config: MockEserviceConfig,
) {
  return buildBearerIntegrityRest02App({
    config,
    jwksResolvers: resolveJwksResolvers(config),
  });
}

export function buildBearerPocUc02CompaniesAppFromConfig(
  config: MockEserviceConfig,
) {
  return buildBearerPocUc02CompaniesApp({
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

function buildBearerIntegrityRest02App({
  config,
  jwksResolvers,
}: {
  config: MockEserviceConfig;
  jwksResolvers: JWTVerifyGetKey[];
}) {
  const { acceptedAudiences, expectedIssuer, knodeId } = config;

  const tokenGenerator = tokenGeneratorBuilder();

  const app = createMockFastifyApp(
    config,
    bearerAuthSecurityScheme,
    bearerAuthSecurity,
    {
      description:
        "Mock e-service for Integrity Rest 02 (legal-entity address lookup)",
      title: "Knodia Mock E-service API (Integrity Rest 02)",
      version: "1.0.0",
    },
    [companyAddressAppTag],
  );

  // No health router: this app is only used for OpenAPI generation, where we don't want /status.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(integrityRest02Plugin, {
      integrityRest02Config: config,
      tokenGenerator,
    });
    protectedApp.register(mockIntegrityRest02Router, { knodeId });
  });

  return app;
}

function buildBearerPocUc02CompaniesApp({
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
      description:
        "Mock e-service API for POC UC02 companies (legal-entity information + evidences)",
      title: "Knodia Mock E-service API (Companies)",
      version: "1.0.0",
    },
    [pocUc02CompaniesAppTag],
  );

  // No health router: this app is only used for OpenAPI generation, where we don't want /status.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockPocUc02CompaniesRouter, { knodeId });
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
  const { acceptedAudiences, expectedIssuer, knodeId } = config;

  const seedConfig = toSignalHubSeedConfig(config);

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
