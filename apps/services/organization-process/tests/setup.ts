import { eventStoreOrganizationEvents } from "@knodia/db-event-store-organization";
import { readmodelOrganization } from "@knodia/db-readmodel-organization";
import {
  type OrganizationWriterService,
  organizationWriterServiceBuilder,
} from "@knodia/db-readmodel-organization/writer";
import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let eventStoreDb: Awaited<ReturnType<typeof setupEventstoreTestDatabase>>;
let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let app: ReturnType<typeof buildApp>;
let organizationWriterService: OrganizationWriterService;

async function resetTestDatabases() {
  await Promise.all([
    resetTestDatabase(eventStoreDb, eventStoreOrganizationEvents),
    resetTestDatabase(readmodelDb, readmodelOrganization),
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

  organizationWriterService = organizationWriterServiceBuilder(readmodelDb);
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await Promise.all([eventStoreDb.$client.end(), readmodelDb.$client.end()]);
});

export { app, eventStoreDb, organizationWriterService };
