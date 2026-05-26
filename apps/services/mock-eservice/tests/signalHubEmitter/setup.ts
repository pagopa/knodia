import { type EserviceId } from "@knodia/common-models/ids";
import { signalHubSignal } from "@knodia/db-signal-hub";
import { setupSignalHubTestDatabase } from "@knodia/test-commons/signalHubDb";
import { type TestDrizzleDb } from "@knodia/test-commons/types";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { asc, eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { SIGNAL_HUB_MOCK_ESERVICE_ID } from "../../src/signalHub/mockup.ts";

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

export function readSignals(
  eserviceId: EserviceId = SIGNAL_HUB_MOCK_ESERVICE_ID,
) {
  return signalHubDb
    .select()
    .from(signalHubSignal)
    .where(eq(signalHubSignal.eserviceId, eserviceId))
    .orderBy(asc(signalHubSignal.signalId));
}

export { signalHubDb };
