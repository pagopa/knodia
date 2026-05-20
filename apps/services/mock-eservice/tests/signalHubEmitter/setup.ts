import { signalHubSignal } from "@knodia/db-signal-hub";
import { setupSignalHubTestDatabase } from "@knodia/test-commons/signalHubDb";
import { type TestDrizzleDb } from "@knodia/test-commons/types";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

let signalHubDb: TestDrizzleDb;

beforeAll(async () => {
  signalHubDb = await setupSignalHubTestDatabase(
    inject("POSTGRES_CONNECTION_STRING"),
  );
});

afterEach(async () => {
  await resetTestDatabase(signalHubDb, signalHubSignal);
});

afterAll(async () => {
  await signalHubDb.$client.end();
});

export { signalHubDb };
