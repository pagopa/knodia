import { eventStoreAgreementEvents } from "@knodia/db-event-store-agreement";
import { readmodelAgreement } from "@knodia/db-readmodel-agreement";
import {
  type AgreementWriterService,
  agreementWriterServiceBuilder,
} from "@knodia/db-readmodel-agreement/writer";
import { readmodelEservice } from "@knodia/db-readmodel-eservice";
import {
  type EserviceWriterService,
  eserviceWriterServiceBuilder,
} from "@knodia/db-readmodel-eservice/writer";
import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let eventStoreDb: Awaited<ReturnType<typeof setupEventstoreTestDatabase>>;
let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let app: ReturnType<typeof buildApp>;
let eserviceWriterService: EserviceWriterService;
let agreementWriterService: AgreementWriterService;

async function resetTestDatabases() {
  await Promise.all([
    resetTestDatabase(eventStoreDb, eventStoreAgreementEvents),
    resetTestDatabase(readmodelDb, readmodelAgreement, readmodelEservice),
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
  agreementWriterService = agreementWriterServiceBuilder(readmodelDb);
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await Promise.all([eventStoreDb.$client.end(), readmodelDb.$client.end()]);
});

export { agreementWriterService, app, eserviceWriterService, eventStoreDb };
