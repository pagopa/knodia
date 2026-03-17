import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import { readmodelEservice } from "@knodia/db-readmodel-eservice";
import {
  type EserviceWriterService,
  eserviceWriterServiceBuilder,
} from "@knodia/db-readmodel-eservice/writer";
import { organizationWriterServiceBuilder } from "@knodia/db-readmodel-organization/writer";
import { TEST_ORGANIZATION_ID } from "@knodia/test-commons/auth";
import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import {
  getMockOrganization,
  resetTestDatabase,
} from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let eventStoreDb: Awaited<ReturnType<typeof setupEventstoreTestDatabase>>;
let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let app: ReturnType<typeof buildApp>;
let eserviceWriterService: EserviceWriterService;

async function resetTestDatabases() {
  await Promise.all([
    resetTestDatabase(eventStoreDb, eventStoreEserviceEvents),
    resetTestDatabase(readmodelDb, readmodelEservice),
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

  eserviceWriterService = eserviceWriterServiceBuilder(readmodelDb);

  const organizationWriterService =
    organizationWriterServiceBuilder(readmodelDb);
  await organizationWriterService.upsertOrganization(
    {
      ...getMockOrganization(),
      id: TEST_ORGANIZATION_ID,
      name: "Test Organization",
    },
    0,
  );
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await Promise.all([eventStoreDb.$client.end(), readmodelDb.$client.end()]);
});

export { app, eserviceWriterService, eventStoreDb };
