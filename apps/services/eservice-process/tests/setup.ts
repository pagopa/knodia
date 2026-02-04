import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { afterAll, afterEach, beforeAll, beforeEach, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let eventStoreDb: Awaited<ReturnType<typeof setupEventstoreTestDatabase>>;
let app: ReturnType<typeof buildApp>;

beforeAll(async () => {
  eventStoreDb = await setupEventstoreTestDatabase(
    inject("EVENTSTORE_CONNECTION_STRING"),
  );

  app = buildApp({
    eventStoreDb,
    loggerConfig: {
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
    },
  });
});

beforeEach(async () => {
  await eventStoreDb.execute("BEGIN");
});

afterEach(async () => {
  await eventStoreDb.execute("ROLLBACK");
});

afterAll(async () => {
  await eventStoreDb.$client.end();
});

export { app, eventStoreDb };
