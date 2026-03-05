import {
  type OrganizationWriterService,
  organizationWriterServiceBuilder,
} from "@knodia/db-readmodel-organization/writer";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { afterAll, afterEach, beforeAll, beforeEach, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let app: ReturnType<typeof buildApp>;
let organizationWriterService: OrganizationWriterService;

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  readmodelDb = await setupReadmodelTestDatabase(connectionString);

  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    readmodelDb,
  });

  organizationWriterService = organizationWriterServiceBuilder(readmodelDb);
});

beforeEach(async () => {
  await readmodelDb.execute("BEGIN");
});

afterEach(async () => {
  await readmodelDb.execute("ROLLBACK");
});

afterAll(async () => {
  await readmodelDb.$client.end();
});

export { app, organizationWriterService };
