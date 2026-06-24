import type { LoggerConfig } from "@knodia/logger/config";
import type { OpenAPIV3 } from "openapi-types";

import { type DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { requestContext } from "@fastify/request-context";
import { createJtiReplayStore } from "@knodia/db-jti-replay-store";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import {
  type RateLimiter,
  rateLimitPlugin,
  rateLimitResponseHeadersPlugin,
} from "@knodia/fastify-zod-api-commons/rate-limit";
import {
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
  dpopAuthSecurity,
  dpopAuthSecurityScheme,
} from "@knodia/fastify-zod-api-commons/security";
import { integrityRest02GeneratorBuilder } from "@knodia/integrity-rest-02/generator";
import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";

import type { MockEserviceConfig } from "./config/config.ts";

import { bearerAccessTokenAuthPlugin } from "./auth/bearerAccessTokenAuthPlugin.ts";
import { dpopAccessTokenAuthPlugin } from "./auth/dpopAccessTokenAuthPlugin.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { integrityRest02Plugin } from "./plugins/integrityRest02Plugin.ts";
import { mockAsyncConsumptionRouter } from "./routers/mockAsyncConsumptionRouter.ts";
import { mockBearerRouter } from "./routers/mockBearerRouter.ts";
import { mockDpopRouter } from "./routers/mockDpopRouter.ts";
import { mockIntegrityRest02Router } from "./routers/mockIntegrityRest02Router.ts";
import { mockPocUc01QualificationsRouter } from "./routers/mockPocUc01QualificationsRouter.ts";
import { mockPocUc01SetQualificationRouter } from "./routers/mockPocUc01SetQualificationRouter.ts";
import { mockPocUc02CompaniesEvidenceUpdateRouter } from "./routers/mockPocUc02CompaniesEvidenceUpdateRouter.ts";
import { mockPocUc02CompaniesRouter } from "./routers/mockPocUc02CompaniesRouter.ts";
import { mockPocUc03SupervisoryBodyRouter } from "./routers/mockPocUc03SupervisoryBodyRouter.ts";
import { mockReceiveDataRouter } from "./routers/mockReceiveDataRouter.ts";
import { mockSignalHubRouter } from "./routers/mockSignalHubRouter.ts";
import { toSignalHubSeedConfig } from "./signalHub/seedEnvConfig.ts";

// Mock-eservice's auth plugins (bearer + DPoP) set `accessTokenClaims` on the
// request context — not Knodia's `authData`. `rateLimitPlugin`'s default key
// resolver reads `authData`, so we override it to key on the consumer's
// home-knode organization id from the access-token claims.
const rateLimitKeyFromAccessTokenClaims = () =>
  requestContext.get("accessTokenClaims")?.consumer.id;

const protectedRateLimitOptions = (rateLimiter: RateLimiter) => ({
  keyFromRequest: rateLimitKeyFromAccessTokenClaims,
  rateLimiter,
});

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
const pocUc01QualificationsAppTag: OpenAPIV3.TagObject = {
  description:
    "Qualifications lookup by uidStudent (Cross-Border E-service, Bearer-protected)",
  name: apiTags.pocUc01Qualifications,
};
const pocUc01SetQualificationAppTag: OpenAPIV3.TagObject = {
  description:
    "Qualification registration by uidStudent (Cross-Border receive-data E-service, Bearer-protected)",
  name: apiTags.pocUc01SetQualification,
};
const pocUc02CompaniesAppTag: OpenAPIV3.TagObject = {
  description:
    "Legal-entity information + evidences lookup by uid_company (Bearer-protected)",
  name: apiTags.pocUc02Companies,
};
const receiveDataAppTag: OpenAPIV3.TagObject = {
  description:
    "Submission of company digital domicile (Cross-Border E-service 04, Bearer-protected, Receive-data mode)",
  name: apiTags.companyDigitalDomicile,
};
const pocUc03SupervisoryBodyAppTag: OpenAPIV3.TagObject = {
  description:
    "ERDS lookup + metadata for the supervisory body (POC UC03 provide-data, Bearer-protected)",
  name: apiTags.pocUc03SupervisoryBody,
};
const companyAddressAppTag: OpenAPIV3.TagObject = {
  description:
    "Legal-entity address lookup by uid_company (Cross-Border E-service 06, Bearer-protected)",
  name: apiTags.companyAddress,
};
const asyncCompanyAddressesAppTag: OpenAPIV3.TagObject = {
  description:
    "Asynchronous legal entity addresses lookup (Cross-Border E-service 05, Bearer-protected)",
  name: apiTags.asyncCompanyAddresses,
};

export function buildApp({
  config,
  dynamoClient,
  jwksResolvers,
  rateLimiter,
}: {
  config: MockEserviceConfig;
  dynamoClient?: DynamoDBClient;
  jwksResolvers: JWTVerifyGetKey[];
  rateLimiter: RateLimiter;
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
      pocUc01QualificationsAppTag,
      pocUc01SetQualificationAppTag,
      pocUc02CompaniesAppTag,
      receiveDataAppTag,
      pocUc03SupervisoryBodyAppTag,
      companyAddressAppTag,
      asyncCompanyAddressesAppTag,
    ],
  );

  app.register(rateLimitResponseHeadersPlugin);

  // Public routes (no auth required)
  app.register(healthRouter);
  // Demo-only evidence-change route (out of spec); self-authenticates the
  // producer's Knode API token, so it sits outside the bearer plugin.
  app.register(mockPocUc02CompaniesEvidenceUpdateRouter, {
    expectedIssuer,
    jwksResolvers,
    knodeId,
    rateLimiter,
  });

  // Bearer-protected routes — bearerAccessTokenAuthPlugin is scoped to this context only.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(
      rateLimitPlugin,
      protectedRateLimitOptions(rateLimiter),
    );
    protectedApp.register(mockBearerRouter, { knodeId });
    protectedApp.register(mockSignalHubRouter, { knodeId, seedConfig });
    protectedApp.register(mockPocUc01QualificationsRouter, { knodeId });
    protectedApp.register(mockPocUc01SetQualificationRouter, { knodeId });
    protectedApp.register(mockPocUc02CompaniesRouter, { knodeId });
    protectedApp.register(mockReceiveDataRouter, { knodeId });
    protectedApp.register(mockPocUc03SupervisoryBodyRouter, { knodeId });
    protectedApp.register(mockAsyncConsumptionRouter, { knodeId });

    protectedApp.register(async (integrityRest02App) => {
      integrityRest02App.register(integrityRest02Plugin, {
        integrityRest02Config: config,
        integrityRest02Generator: integrityRest02GeneratorBuilder(),
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
    protectedApp.register(
      rateLimitPlugin,
      protectedRateLimitOptions(rateLimiter),
    );
    protectedApp.register(mockDpopRouter, { knodeId });
  });

  app.addHook("onClose", async () => {
    await rateLimiter.disconnect();
  });

  return app;
}

export function buildAppFromConfig(
  config: MockEserviceConfig,
  rateLimiter: RateLimiter,
) {
  return buildApp({
    config,
    jwksResolvers: resolveJwksResolvers(config),
    rateLimiter,
  });
}

export function buildBearerAppFromConfig(config: MockEserviceConfig) {
  return buildBearerApp({
    config,
    jwksResolvers: resolveJwksResolvers(config),
  });
}

export function buildBearerAsyncConsumptionAppFromConfig(
  config: MockEserviceConfig,
) {
  return buildBearerAsyncConsumptionApp({
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

export function buildBearerPocUc01QualificationsAppFromConfig(
  config: MockEserviceConfig,
) {
  return buildBearerPocUc01QualificationsApp({
    config,
    jwksResolvers: resolveJwksResolvers(config),
  });
}

export function buildBearerPocUc01SetQualificationAppFromConfig(
  config: MockEserviceConfig,
) {
  return buildBearerPocUc01SetQualificationApp({
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

export function buildBearerPocUc03SupervisoryBodyAppFromConfig(
  config: MockEserviceConfig,
) {
  return buildBearerPocUc03SupervisoryBodyApp({
    config,
    jwksResolvers: resolveJwksResolvers(config),
  });
}

export function buildBearerReceiveDataAppFromConfig(
  config: MockEserviceConfig,
) {
  return buildBearerReceiveDataApp({
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

function buildBearerAsyncConsumptionApp({
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
        "Mock e-service for Async Consumption (legal-entity addresses lookup)",
      title: "Knodia Mock E-service API (Async Consumption)",
      version: "1.0.0",
    },
    [asyncCompanyAddressesAppTag],
  );

  // No health router: this app is only used for OpenAPI generation, where we don't want /status.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockAsyncConsumptionRouter, { knodeId });
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
      integrityRest02Generator: integrityRest02GeneratorBuilder(),
    });
    protectedApp.register(mockIntegrityRest02Router, { knodeId });
  });

  return app;
}

function buildBearerPocUc01QualificationsApp({
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
        "Mock e-service API for POC UC01 qualifications (getQualifications)",
      title: "Knodia Mock E-service API (Qualifications)",
      version: "1.0.0",
    },
    [pocUc01QualificationsAppTag],
  );

  // No health router: this app is only used for OpenAPI generation, where we don't want /status.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockPocUc01QualificationsRouter, { knodeId });
  });

  return app;
}

function buildBearerPocUc01SetQualificationApp({
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
        "Mock e-service API for POC UC01 setQualification (receive-data)",
      title: "Knodia Mock E-service API (Set Qualification)",
      version: "1.0.0",
    },
    [pocUc01SetQualificationAppTag],
  );

  // No health router: this app is only used for OpenAPI generation, where we don't want /status.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockPocUc01SetQualificationRouter, { knodeId });
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

function buildBearerPocUc03SupervisoryBodyApp({
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
        "Mock e-service API for POC UC03 supervisory body (lookupERDS + getERDSMetadata)",
      title: "Knodia Mock E-service API (ERDS Lookup & Metadata)",
      version: "1.0.0",
    },
    [pocUc03SupervisoryBodyAppTag],
  );

  // No health router: this app is only used for OpenAPI generation, where we don't want /status.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockPocUc03SupervisoryBodyRouter, { knodeId });
  });

  return app;
}

function buildBearerReceiveDataApp({
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
        "Mock e-service API for cross-border company digital domicile submission (Receive data)",
      title: "Knodia Mock E-service API (Receive Data)",
      version: "1.0.0",
    },
    [receiveDataAppTag],
  );

  // No health router: this app is only used for OpenAPI generation, where we don't want /status.
  app.register(async (protectedApp) => {
    protectedApp.register(bearerAccessTokenAuthPlugin, {
      acceptedAudiences,
      expectedIssuer,
      jwksResolvers,
    });
    protectedApp.register(mockReceiveDataRouter, { knodeId });
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
