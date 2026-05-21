import {
  type CorrelationId,
  type EserviceId,
  generateId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { signalHubSignal } from "@knodia/db-signal-hub";
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { rotatingFiscalCodes } from "../../src/data/rotatingAddresses.ts";
import { emitTransition } from "../../src/signalHub/emitter/emit.ts";
import { SIGNAL_HUB_MOCK_ESERVICE_ID } from "../../src/signalHub/mockup.ts";
import { phaseAt } from "../../src/signalHub/phase.ts";
import { pseudonymize } from "../../src/signalHub/pseudonymize.ts";
import {
  getRotatedSeed,
  type SignalHubSeedConfig,
} from "../../src/signalHub/rotation.ts";
import { SignalType } from "../../src/signalHub/signal.ts";
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
  it("inserts 1 SeedUpdate + N phase rows in a single batch with a shared correlation_id", async () => {
    const batch = await emitTransition({
      db: signalHubDb,
      now: inPeriod(0),
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
      (r) => r.signalType === SignalType.enum.SeedUpdate,
    );
    expect(seedUpdates).toHaveLength(1);
    expect(seedUpdates[0]?.objectId).toBe("");
    expect(seedUpdates[0]?.objectType).toBe("");

    const phaseRows = rows.filter(
      (r) => r.signalType !== SignalType.enum.SeedUpdate,
    );
    expect(phaseRows).toHaveLength(rotatingFiscalCodes.length);
    for (const r of phaseRows) {
      expect(r.signalType).toBe(SignalType.enum.Create);
      expect(r.objectType).toBe("residence");
    }

    const expectedObjectIds = new Set(
      rotatingFiscalCodes.map((fc) => pseudonymize(fc, batch.seed)),
    );
    expect(new Set(phaseRows.map((r) => r.objectId))).toEqual(
      expectedObjectIds,
    );
  });

  it("rotates the phase across consecutive periods (Create → Update → Delete)", async () => {
    for (const periodId of [0, 1, 2]) {
      await emitTransition({
        db: signalHubDb,
        now: inPeriod(periodId),
        seedConfig,
      });
    }

    const rows = await readSignals(SIGNAL_HUB_MOCK_ESERVICE_ID);
    const phaseRows = rows.filter(
      (r) => r.signalType !== SignalType.enum.SeedUpdate,
    );

    expect(
      phaseRows.filter((r) => r.signalType === SignalType.enum.Create),
    ).toHaveLength(rotatingFiscalCodes.length);
    expect(
      phaseRows.filter((r) => r.signalType === SignalType.enum.Update),
    ).toHaveLength(rotatingFiscalCodes.length);
    expect(
      phaseRows.filter((r) => r.signalType === SignalType.enum.Delete),
    ).toHaveLength(rotatingFiscalCodes.length);

    const correlationIds = new Set(rows.map((r) => r.correlationId));
    expect(correlationIds.size).toBe(3);

    const signalIds = rows.map((r) => r.signalId);
    expect(signalIds).toEqual([...signalIds].sort((a, b) => a - b));
    expect(new Set(signalIds).size).toBe(signalIds.length);
  });

  it("derives objectId from the period's seed for each rotating fiscal code", async () => {
    const periodId = 1;
    const now = inPeriod(periodId);
    await emitTransition({ db: signalHubDb, now, seedConfig });

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

  it("reads max(signal_id) per eservice on each emit (concurrent writers don't desync)", async () => {
    // Pre-seed: a row at signal_id=100 for the mock eservice (simulating a
    // concurrent writer) and a row at signal_id=999 for an unrelated
    // eservice. The next emit must pick up from 101 (mock's max + 1) and
    // ignore the other eservice's max.
    await signalHubDb.insert(signalHubSignal).values([
      {
        correlationId: generateId<CorrelationId>(),
        eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
        objectId: "",
        objectType: "",
        signalId: 100,
        signalType: SignalType.enum.SeedUpdate,
      },
      {
        correlationId: generateId<CorrelationId>(),
        eserviceId: OTHER_ESERVICE_ID,
        objectId: "",
        objectType: "",
        signalId: 999,
        signalType: SignalType.enum.SeedUpdate,
      },
    ]);

    await emitTransition({
      db: signalHubDb,
      now: inPeriod(0),
      seedConfig,
    });
    await emitTransition({
      db: signalHubDb,
      now: inPeriod(1),
      seedConfig,
    });

    const ourRows = await readSignals(SIGNAL_HUB_MOCK_ESERVICE_ID);
    expect(ourRows.map((r) => r.signalId)).toEqual([
      100, 101, 102, 103, 104, 105, 106, 107, 108,
    ]);

    const otherRows = await readSignals(OTHER_ESERVICE_ID);
    expect(otherRows.map((r) => r.signalId)).toEqual([999]);
  });
});
