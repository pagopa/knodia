import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { upsertEservice } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, beforeEach, inject, vi } from "vitest";

import { buildApp } from "../src/app.ts";
import { mockEservices } from "./mockEservices.ts";

let eventStoreDb: Awaited<ReturnType<typeof setupEventstoreTestDatabase>>;
let readModelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let app: ReturnType<typeof buildApp>;

beforeAll(async () => {
  eventStoreDb = await setupEventstoreTestDatabase(
    inject("EVENTSTORE_CONNECTION_STRING"),
  );

  readModelDb = await setupReadmodelTestDatabase(
    inject("READMODEL_CONNECTION_STRING"),
  );

  app = buildApp({
    eventStoreDb,
    loggerConfig: {
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
    },
    readModelDb,
  });

  await Promise.all(
    mockEservices.map((eservice) => upsertEservice(eservice, 0, readModelDb)),
  );
});

beforeEach(async () => {
  await Promise.all([
    eventStoreDb.execute("BEGIN"),
    readModelDb.execute("BEGIN"),
  ]);
});

afterEach(async () => {
  await Promise.all([
    eventStoreDb.execute("ROLLBACK"),
    readModelDb.execute("ROLLBACK"),
  ]);
});

afterAll(async () => {
  await Promise.all([eventStoreDb.$client.end(), readModelDb.$client.end()]);

  vi.useRealTimers();
});

export { app, eventStoreDb };
