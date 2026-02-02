import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  cleanupEventstoreTestDatabase,
  setupEventstoreTestDatabase,
} from "@knodia/test-commons/eventstore";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

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
    serviceName: "eservice-process-test",
  });
});

afterEach(async () => {
  await cleanupEventstoreTestDatabase(eventStoreDb);
});

afterAll(async () => {
  await eventStoreDb.$client.end();
});

export async function getAllEserviceEvents() {
  return await eventStoreDb.select().from(eventStoreEserviceEvents);
}

export function injectAppRequest() {
  return app.inject().headers({
    [CORRELATION_ID_HEADER]: crypto.randomUUID(),
  });
}
