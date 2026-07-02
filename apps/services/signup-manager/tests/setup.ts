import type { Producer } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { TestDrizzleDb } from "@knodia/test-commons/types";
import type { FastifyInstance } from "fastify";

import {
  deletedSignupUser,
  emailChangeRequest,
  signupUser,
} from "@knodia/db-signup";
import { noopRateLimiter } from "@knodia/fastify-zod-api-commons/rate-limit";
import { setupSignupTestDatabase } from "@knodia/test-commons/signupDb";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject, vi } from "vitest";

import { buildApp } from "../src/app.ts";

let app: FastifyInstance;
let signupDb: TestDrizzleDb;
const kafkaProducerMock = {
  send: vi.fn<Producer["send"]>(),
};

const oneIdentityMockConfig = {
  oneIdentityClientId: "test-one-identity-client-id",
  oneIdentityClientSecret: "test-one-identity-client-secret",
  oneIdentityDomain: "https://test.one-identity.com",
  oneIdentityJWKSUri: "https://test.one-identity.com/.well-known/jwks.json",
  oneIdentityRedirectUrl: "https://localhost:5176/ui/login/callback",
} as const;

export const signupManagerTestConfig: Parameters<typeof buildApp>[0]["config"] =
  {
    acceptedAudiences: ["test-audience"],
    // Restricted to the domain used by every test fixture, so the gate is
    // active (allowing the rejection tests) without breaking the success paths.
    allowedEmailDomains: ["example.com"],
    isProduction: false,
    logLevel: "silent",
    nodeEnv: "test",
    signupTopic: "test-signup-topic",
    uiSignupSessionJwt: {
      audience: "test-audience",
      issuer: "test-issuer",
      kid: "alias/test-kid",
      secondsDuration: 3600,
    },
    wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    ...oneIdentityMockConfig,
  };

async function resetTestDatabases() {
  await resetTestDatabase(
    signupDb,
    emailChangeRequest,
    deletedSignupUser,
    signupUser,
  );
}

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  signupDb = await setupSignupTestDatabase(connectionString);

  app = buildApp({
    config: signupManagerTestConfig,
    kafkaProducer: kafkaProducerMock as unknown as Producer,
    rateLimiter: noopRateLimiter,
    signupDb,
  });

  await app.ready();
});

afterEach(async () => {
  await resetTestDatabases();
  kafkaProducerMock.send.mockReset();
});

afterAll(async () => {
  await Promise.all([app.close(), signupDb.$client.end()]);
});

export { app, kafkaProducerMock, oneIdentityMockConfig, signupDb };
