import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { signalHubSignal } from "@knodia/db-signal-hub";
import { type SignalHubSeedConfig } from "@knodia/mock-eservice-signal-hub-commons/rotation";
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { makeSignalIdAllocator } from "../src/cron/counter.ts";
import { startScheduler } from "../src/cron/scheduler.ts";
import { signalHubDb } from "./setup.ts";

const ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);

// Real timers with a short period — using fake timers would also freeze
// the pg testcontainer's internal scheduling and hang.
const PERIOD_MS = 200;
const seedConfig: SignalHubSeedConfig = {
  expireSeconds: PERIOD_MS / 1000,
  saltLength: 16,
  startDateMs: Date.now() - 10_000,
};

const silentLogger = {
  debug: () => {},
  error: () => {},
  fatal: () => {},
  info: () => {},
  trace: () => {},
  warn: () => {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

async function readSignals() {
  return signalHubDb
    .select()
    .from(signalHubSignal)
    .where(eq(signalHubSignal.eserviceId, ESERVICE_ID))
    .orderBy(asc(signalHubSignal.signalId));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("startScheduler", () => {
  it("emits a transition at boot", async () => {
    const allocator = makeSignalIdAllocator(0);
    const handle = await startScheduler({
      allocator,
      db: signalHubDb,
      eserviceId: ESERVICE_ID,
      logger: silentLogger,
      seedConfig,
    });

    const rows = await readSignals();
    expect(rows).toHaveLength(4);
    const correlationIds = new Set(rows.map((r) => r.correlationId));
    expect(correlationIds.size).toBe(1);

    handle.stop();
  });

  it("emits the next transition at the period boundary, with a fresh correlation_id", async () => {
    const allocator = makeSignalIdAllocator(0);
    const handle = await startScheduler({
      allocator,
      db: signalHubDb,
      eserviceId: ESERVICE_ID,
      logger: silentLogger,
      seedConfig,
    });

    // Wait past at least one boundary.
    await sleep(PERIOD_MS + 100);
    handle.stop();

    const rows = await readSignals();
    expect(rows.length).toBeGreaterThanOrEqual(8);
    expect(
      new Set(rows.map((r) => r.correlationId)).size,
    ).toBeGreaterThanOrEqual(2);
  });

  it("stop() halts further emissions", async () => {
    const allocator = makeSignalIdAllocator(0);
    const handle = await startScheduler({
      allocator,
      db: signalHubDb,
      eserviceId: ESERVICE_ID,
      logger: silentLogger,
      seedConfig,
    });

    handle.stop();
    await sleep(3 * PERIOD_MS + 100);

    const rows = await readSignals();
    // Only the boot emission — no further transitions after stop().
    expect(rows).toHaveLength(4);
  });
});
