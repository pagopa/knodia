import type { FastifyInstance } from "fastify";

import { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import {
  readmodelConsumerKeychain,
  readmodelKnodeApiKeychain,
  readmodelProducerKeychain,
} from "@knodia/db-readmodel-keychain";
import {
  type ConsumerKeychainWriterService,
  consumerKeychainWriterServiceBuilder,
  type KnodeApiKeychainWriterService,
  knodeApiKeychainWriterServiceBuilder,
  type ProducerKeychainWriterService,
  producerKeychainWriterServiceBuilder,
} from "@knodia/db-readmodel-keychain/services";
import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { type TestDrizzleDb } from "@knodia/test-commons/types";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let eventStoreDb: TestDrizzleDb;
let readmodelDb: TestDrizzleDb;
let app: FastifyInstance;
let consumerKeychainWriterService: ConsumerKeychainWriterService;
let knodeApiKeychainWriterService: KnodeApiKeychainWriterService;
let producerKeychainWriterService: ProducerKeychainWriterService;
export const mockMaxKeysPerKeychain = 5;

async function resetTestDatabases() {
  await Promise.all([
    resetTestDatabase(eventStoreDb, eventStoreKeychainEvents),
    resetTestDatabase(
      readmodelDb,
      readmodelConsumerKeychain,
      readmodelKnodeApiKeychain,
      readmodelProducerKeychain,
    ),
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
      maxKeysPerKeychain: mockMaxKeysPerKeychain,
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    eventStoreDb,
    readmodelDb,
    remoteResourcesManagerUrl: "http://test-remote-resources-manager",
  });

  consumerKeychainWriterService =
    consumerKeychainWriterServiceBuilder(readmodelDb);
  knodeApiKeychainWriterService =
    knodeApiKeychainWriterServiceBuilder(readmodelDb);
  producerKeychainWriterService =
    producerKeychainWriterServiceBuilder(readmodelDb);
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await Promise.all([eventStoreDb.$client.end(), readmodelDb.$client.end()]);
});

export {
  app,
  consumerKeychainWriterService,
  eventStoreDb,
  knodeApiKeychainWriterService,
  producerKeychainWriterService,
};
