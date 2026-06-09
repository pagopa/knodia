import type { Producer } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { TestDrizzleDb } from "@knodia/test-commons/types";
import type { FastifyInstance } from "fastify";

import { signupUser } from "@knodia/db-signup";
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
  oneIdentityRedirectUrl: "https://localhost:5176/login/callback",
} as const;

async function resetTestDatabases() {
  await Promise.all([resetTestDatabase(signupDb, signupUser)]);
}

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  signupDb = await setupSignupTestDatabase(connectionString);

  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
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
    },
    kafkaProducer: kafkaProducerMock as unknown as Producer,
    signupDb,
  });
});

afterEach(async () => {
  await resetTestDatabases();
  kafkaProducerMock.send.mockReset();
});

afterAll(async () => {
  await Promise.all([signupDb.$client.end()]);
});

export { app, kafkaProducerMock, oneIdentityMockConfig, signupDb };
