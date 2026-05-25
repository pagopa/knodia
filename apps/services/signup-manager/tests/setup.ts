import type { FastifyInstance } from "fastify";

import { beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

let app: FastifyInstance;

const oneIdentityMockConfig = {
  oneIdentityClientId: "test-one-identity-client-id",
  oneIdentityClientSecret: "test-one-identity-client-secret",
  oneIdentityDomain: "https://test.one-identity.com",
  oneIdentityJWKSUri: "https://test.one-identity.com/.well-known/jwks.json",
  oneIdentityRedirectUrl: "https://localhost:5176/login/callback",
} as const;

beforeAll(async () => {
  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      host: "localhost",
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      port: 0,
      signupSessionJwt: {
        audience: "test-audience",
        issuer: "test-issuer",
        kid: "alias/test-kid",
        secondsDuration: 3600,
      },
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
      ...oneIdentityMockConfig,
    },
  });
});

export { app, oneIdentityMockConfig };
