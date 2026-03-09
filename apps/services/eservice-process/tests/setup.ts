import {
  type EserviceWriterService,
  eserviceWriterServiceBuilder,
} from "@knodia/db-readmodel-eservice/writer";
import { readmodelOrganization } from "@knodia/db-readmodel-organization";
import { TEST_ORGANIZATION_ID } from "@knodia/test-commons/auth";
import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { afterAll, afterEach, beforeAll, beforeEach, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let eventStoreDb: Awaited<ReturnType<typeof setupEventstoreTestDatabase>>;
let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let app: ReturnType<typeof buildApp>;
let eserviceWriterService: EserviceWriterService;

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

  eserviceWriterService = eserviceWriterServiceBuilder(readmodelDb);

  await readmodelDb.insert(readmodelOrganization).values({
    id: TEST_ORGANIZATION_ID,
    metadataVersion: 0,
    name: "Test Organization",
    updatedAt: new Date(),
  });
});

beforeEach(async () => {
  await Promise.all([
    eventStoreDb.execute("BEGIN"),
    readmodelDb.execute("BEGIN"),
  ]);
});

afterEach(async () => {
  await Promise.all([
    eventStoreDb.execute("ROLLBACK"),
    readmodelDb.execute("ROLLBACK"),
  ]);
});

afterAll(async () => {
  await Promise.all([eventStoreDb.$client.end(), readmodelDb.$client.end()]);
});

export { app, eserviceWriterService, eventStoreDb };
