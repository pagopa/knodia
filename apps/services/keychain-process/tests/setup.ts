import { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import { readmodelConsumerKeychain } from "@knodia/db-readmodel-keychain";
import {
  keychainWriterBuilder,
  type KeychainWriterService,
} from "@knodia/db-readmodel-keychain/writer";
import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let eventStoreDb: Awaited<ReturnType<typeof setupEventstoreTestDatabase>>;
let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let app: ReturnType<typeof buildApp>;
let consumerKeychainWriterService: KeychainWriterService;

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
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    eventStoreDb,
    readmodelDb,
  });

  consumerKeychainWriterService = keychainWriterBuilder(readmodelDb);
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await Promise.all([eventStoreDb.$client.end(), readmodelDb.$client.end()]);
});

export { app, consumerKeychainWriterService, eventStoreDb };
