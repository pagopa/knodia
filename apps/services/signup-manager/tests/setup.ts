import type { FastifyInstance } from "fastify";

import { beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

let app: FastifyInstance;

const oneIdentityMockConfig = {
  oneIdentityClientId: "test-one-identity-client-id",
  oneIdentityClientSecret: "test-one-identity-client-secret",
  oneIdentityDomain: "https://test.one-identity.com",
  oneIdentityJWKSUri: "https://test.one-identity.com/.well-known/jwks.json",
  oneIdentityRedirectUrl: "https://localhost:5176/auth/oidc/callback",
} as const;

beforeAll(async () => {
  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
      ...oneIdentityMockConfig,
    },
  });
});

export { app, oneIdentityMockConfig };
