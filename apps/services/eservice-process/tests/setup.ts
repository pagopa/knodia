import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { afterAll, afterEach, beforeAll, beforeEach, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let eventStoreDb: Awaited<ReturnType<typeof setupEventstoreTestDatabase>>;
let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let app: ReturnType<typeof buildApp>;

beforeAll(async () => {
  eventStoreDb = await setupEventstoreTestDatabase(
    inject("EVENTSTORE_CONNECTION_STRING"),
  );

  readmodelDb = await setupReadmodelTestDatabase(
    inject("READMODEL_CONNECTION_STRING"),
  );

  app = buildApp({
    eventStoreDb,
    loggerConfig: {
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
    },
    readmodelDb,
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

export { app, eventStoreDb, readmodelDb };
