import type { TestDrizzleDb } from "@knodia/test-commons/types";
import type { Logger } from "pino";

import { signalHubSignal } from "@knodia/db-signal-hub";
import {
  type SignalHubDbService,
  signalHubDbServiceBuilder,
} from "@knodia/db-signal-hub/services";
import { setupSignalHubTestDatabase } from "@knodia/test-commons/signalHubDb";
import {
  createTestLogger,
  resetTestDatabase,
} from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import {
  type SignalHubService,
  signalHubServiceBuilder,
} from "../src/services/signalHubService.ts";

let signalHubDb: TestDrizzleDb;
let signalHubDbService: SignalHubDbService;
let logger: Logger;
let signalHubService: SignalHubService;

async function resetTestDatabases() {
  await Promise.all([resetTestDatabase(signalHubDb, signalHubSignal)]);
}

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  signalHubDb = await setupSignalHubTestDatabase(connectionString);
  signalHubDbService = signalHubDbServiceBuilder(signalHubDb);
  logger = createTestLogger().logger;
  signalHubService = signalHubServiceBuilder(signalHubDb, logger);
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await signalHubDb.$client.end();
});

export { logger, signalHubDb, signalHubDbService, signalHubService };
