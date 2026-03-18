import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { resetTestDatabase } from "../../../../packages/test-commons/src/utils/dbIsolation.ts";
import { buildApp } from "../src/app.ts";

let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let app: ReturnType<typeof buildApp>;

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
});

afterEach(async () => {
  await resetTestDatabase(readmodelDb, readmodelPurpose);
});

afterAll(async () => {
  await readmodelDb.$client.end();
});

export { app, readmodelDb };
