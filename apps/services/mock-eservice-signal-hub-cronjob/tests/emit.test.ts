import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { signalHubSignal } from "@knodia/db-signal-hub";
import {
  rotatingFiscalCodes,
  SIGNAL_HUB_MOCK_ESERVICE_ID,
} from "@knodia/mock-eservice-signal-hub-commons/mockup";
import { phaseAt } from "@knodia/mock-eservice-signal-hub-commons/phase";
import { pseudonymize } from "@knodia/mock-eservice-signal-hub-commons/pseudonymize";
import {
  getRotatedSeed,
  type SignalHubSeedConfig,
} from "@knodia/mock-eservice-signal-hub-commons/rotation";
import { SignalType } from "@knodia/mock-eservice-signal-hub-commons/signal";
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { makeSignalIdAllocator } from "../src/cron/counter.ts";
import { emitTransition } from "../src/cron/emit.ts";
import { signalHubDb } from "./setup.ts";

const OTHER_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "11111111-1111-4111-8111-111111111111",
);

const seedConfig: SignalHubSeedConfig = {
  expireSeconds: 30,
  saltLength: 16,
  startDateMs: 1_000_000,
};

const inPeriod = (periodId: number) =>
  seedConfig.startDateMs + periodId * seedConfig.expireSeconds * 1000 + 1_000;

async function readSignals(eserviceId: EserviceId) {
  return signalHubDb
    .select()
    .from(signalHubSignal)
    .where(eq(signalHubSignal.eserviceId, eserviceId))
    .orderBy(asc(signalHubSignal.signalId));
}

describe("emitTransition", () => {
  it("inserts 1 SEEDUPDATE + N phase rows in a single batch with a shared correlation_id", async () => {
    const allocator = makeSignalIdAllocator(0);
    const now = inPeriod(0);
    const batch = await emitTransition({
      allocator,
      db: signalHubDb,
      eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
      now,
      seedConfig,
    });

    const rows = await readSignals(SIGNAL_HUB_MOCK_ESERVICE_ID);
    expect(rows).toHaveLength(1 + rotatingFiscalCodes.length);

    const correlationIds = new Set(rows.map((r) => r.correlationId));
    expect(correlationIds.size).toBe(1);
    expect([...correlationIds][0]).toBe(batch.correlationId);

    const signalIds = rows.map((r) => r.signalId);
    expect(signalIds).toEqual([1, 2, 3, 4]);

    const seedUpdates = rows.filter(
      (r) => r.signalType === SignalType.enum.SEEDUPDATE,
    );
    expect(seedUpdates).toHaveLength(1);
    expect(seedUpdates[0]?.objectId).toBe("");
    expect(seedUpdates[0]?.objectType).toBe("");

    const phaseRows = rows.filter(
      (r) => r.signalType !== SignalType.enum.SEEDUPDATE,
    );
    expect(phaseRows).toHaveLength(rotatingFiscalCodes.length);
    for (const r of phaseRows) {
      expect(r.signalType).toBe(SignalType.enum.CREATE);
      expect(r.objectType).toBe("residence");
    }

    const expectedObjectIds = new Set(
      rotatingFiscalCodes.map((fc) => pseudonymize(fc, batch.seed)),
    );
    expect(new Set(phaseRows.map((r) => r.objectId))).toEqual(
      expectedObjectIds,
    );
  });

  it("rotates the phase across consecutive periods (CREATE → UPDATE → DELETE)", async () => {
    const allocator = makeSignalIdAllocator(0);

    for (const periodId of [0, 1, 2]) {
      await emitTransition({
        allocator,
        db: signalHubDb,
        eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
        now: inPeriod(periodId),
        seedConfig,
      });
    }

    const rows = await readSignals(SIGNAL_HUB_MOCK_ESERVICE_ID);
    const phaseRows = rows.filter(
      (r) => r.signalType !== SignalType.enum.SEEDUPDATE,
    );

    expect(
      phaseRows.filter((r) => r.signalType === SignalType.enum.CREATE),
    ).toHaveLength(rotatingFiscalCodes.length);
    expect(
      phaseRows.filter((r) => r.signalType === SignalType.enum.UPDATE),
    ).toHaveLength(rotatingFiscalCodes.length);
    expect(
      phaseRows.filter((r) => r.signalType === SignalType.enum.DELETE),
    ).toHaveLength(rotatingFiscalCodes.length);

    const correlationIds = new Set(rows.map((r) => r.correlationId));
    expect(correlationIds.size).toBe(3);

    const signalIds = rows.map((r) => r.signalId);
    expect(signalIds).toEqual([...signalIds].sort((a, b) => a - b));
    expect(new Set(signalIds).size).toBe(signalIds.length);
  });

  it("derives objectId from the period's seed for each rotating fiscal code", async () => {
    const allocator = makeSignalIdAllocator(0);
    const periodId = 1;
    const now = inPeriod(periodId);
    await emitTransition({
      allocator,
      db: signalHubDb,
      eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
      now,
      seedConfig,
    });

    const seed = getRotatedSeed(SIGNAL_HUB_MOCK_ESERVICE_ID, now, seedConfig);
    const expected = new Set(
      rotatingFiscalCodes.map((fc) => pseudonymize(fc, seed)),
    );

    const rows = await readSignals(SIGNAL_HUB_MOCK_ESERVICE_ID);
    const phaseObjectIds = new Set(
      rows
        .filter((r) => r.signalType === phaseAt(periodId))
        .map((r) => r.objectId),
    );
    expect(phaseObjectIds).toEqual(expected);
  });

  it("continues monotonic signal_id allocation across batches and isolates per eservice", async () => {
    const allocator = makeSignalIdAllocator(100);
    await emitTransition({
      allocator,
      db: signalHubDb,
      eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
      now: inPeriod(0),
      seedConfig,
    });
    await emitTransition({
      allocator,
      db: signalHubDb,
      eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
      now: inPeriod(1),
      seedConfig,
    });

    // A different e-service uses its own allocator and writes independently.
    const otherAllocator = makeSignalIdAllocator(0);
    await emitTransition({
      allocator: otherAllocator,
      db: signalHubDb,
      eserviceId: OTHER_ESERVICE_ID,
      now: inPeriod(0),
      seedConfig,
    });

    const ourRows = await readSignals(SIGNAL_HUB_MOCK_ESERVICE_ID);
    expect(ourRows.map((r) => r.signalId)).toEqual([
      101, 102, 103, 104, 105, 106, 107, 108,
    ]);

    const otherRows = await readSignals(OTHER_ESERVICE_ID);
    expect(otherRows.map((r) => r.signalId)).toEqual([1, 2, 3, 4]);
  });
});
