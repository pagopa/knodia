import type { FastifyInstance } from "fastify";

import { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import { readmodelConsumerKeychain } from "@knodia/db-readmodel-keychain";
import {
  type KeychainWriterService,
  keychainWriterServiceBuilder,
} from "@knodia/db-readmodel-keychain/writer";
import {
  type PurposeWriterService,
  purposeWriterServiceBuilder,
} from "@knodia/db-readmodel-purpose/writer";
import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { type TestDrizzleDb } from "@knodia/test-commons/types";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let eventStoreDb: TestDrizzleDb;
let readmodelDb: TestDrizzleDb;
let app: FastifyInstance;
let keychainWriterService: KeychainWriterService;
let purposeWriterService: PurposeWriterService;

async function resetTestDatabases() {
  await Promise.all([
    resetTestDatabase(eventStoreDb, eventStoreKeychainEvents),
    resetTestDatabase(readmodelDb, readmodelConsumerKeychain),
  ]);
}

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  eventStoreDb = await setupEventstoreTestDatabase(connectionString);
  readmodelDb = await setupReadmodelTestDatabase(connectionString);

  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      cognitoUserPoolId: "test-user-pool-id",
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    eventStoreDb,
    readmodelDb,
  });

  keychainWriterService = keychainWriterServiceBuilder(readmodelDb);
  purposeWriterService = purposeWriterServiceBuilder(readmodelDb);
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await Promise.all([eventStoreDb.$client.end(), readmodelDb.$client.end()]);
});

export { app, eventStoreDb, keychainWriterService, purposeWriterService };
