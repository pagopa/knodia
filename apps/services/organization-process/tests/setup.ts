import type { TestDrizzleDb } from "@knodia/test-commons/types";
import type { FastifyInstance } from "fastify";

import { KnodeId } from "@knodia/common-models/ids";
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

let eventStoreDb: TestDrizzleDb;
let readmodelDb: TestDrizzleDb;
let app: FastifyInstance;
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
      cognitoUserPoolId: "test-user-pool-id",
      isProduction: false,
      knodeId: KnodeId.enum.Orion,
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

export { app, eventStoreDb, organizationWriterService, readmodelDb };
