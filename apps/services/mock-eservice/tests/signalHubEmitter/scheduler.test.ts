import { createTestLogger } from "@knodia/test-commons/utils";
import { describe, expect, it, vi } from "vitest";

import { rotatingFiscalCodes } from "../../src/data/rotatingAddresses.ts";
import { startSignalHubMockScheduler } from "../../src/signalHub/emitter/scheduler.ts";
import { SIGNAL_HUB_MOCK_ESERVICE_ID } from "../../src/signalHub/mockup.ts";
import { pseudonymize } from "../../src/signalHub/pseudonymize.ts";
import {
  computePeriodId,
  getRotatedSeed,
  type SignalHubSeedConfig,
} from "../../src/signalHub/rotation.ts";
import { readSignals, signalHubDb } from "./setup.ts";

// Real timers with a short period — using fake timers would also freeze
// the pg testcontainer's internal scheduling and hang.
const PERIOD_MS = 200;
const seedConfig: SignalHubSeedConfig = {
  expireSeconds: PERIOD_MS / 1000,
  saltLength: 16,
  startDateMs: Date.now() - 10_000,
};

const { logger } = createTestLogger();

// A period's object_ids uniquely fingerprint it: object_id =
// sha256(fiscalCode + seed) and the seed derives from the periodId.
function objectIdsForPeriod(periodId: number): string[] {
  const periodStartMs =
    seedConfig.startDateMs + periodId * seedConfig.expireSeconds * 1000;
  const seed = getRotatedSeed(
    SIGNAL_HUB_MOCK_ESERVICE_ID,
    periodStartMs,
    seedConfig,
  );
  return rotatingFiscalCodes.map((fc) => pseudonymize(fc, seed));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("startSignalHubMockScheduler", () => {
  it("emits a transition at boot", async () => {
    const handle = await startSignalHubMockScheduler({
      db: signalHubDb,
      logger,
      seedConfig,
    });

    const rows = await readSignals();
    expect(rows).toHaveLength(4);
    const correlationIds = new Set(rows.map((r) => r.correlationId));
    expect(correlationIds.size).toBe(1);

    handle.stop();
  });

  it("emits the next transition at the period boundary, with a fresh correlation_id", async () => {
    const bootPeriod = computePeriodId(Date.now(), seedConfig);
    const handle = await startSignalHubMockScheduler({
      db: signalHubDb,
      logger,
      seedConfig,
    });

    await sleep(PERIOD_MS + 100);
    handle.stop();

    const rows = await readSignals();
    const emitted = new Set(rows.map((r) => r.objectId));
    expect(objectIdsForPeriod(bootPeriod).every((id) => emitted.has(id))).toBe(
      true,
    );
    expect(
      objectIdsForPeriod(bootPeriod + 1).every((id) => emitted.has(id)),
    ).toBe(true);
    expect(
      new Set(rows.map((r) => r.correlationId)).size,
    ).toBeGreaterThanOrEqual(2);
  });

  it("stop() halts further emissions", async () => {
    const handle = await startSignalHubMockScheduler({
      db: signalHubDb,
      logger,
      seedConfig,
    });

    handle.stop();
    await sleep(3 * PERIOD_MS + 100);

    const rows = await readSignals();
    expect(rows).toHaveLength(4);
  });

  it("a runtime emit failure is logged and does not exit the process", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      code?: number,
    ) => {
      throw new Error(`process.exit unexpectedly called with code ${code}`);
    }) as never);

    const handle = await startSignalHubMockScheduler({
      db: signalHubDb,
      logger,
      seedConfig,
    });

    // Boot already emitted; this fails only the next tick's insert.
    const txSpy = vi
      .spyOn(signalHubDb, "transaction")
      .mockRejectedValue(new Error("simulated DB failure"));

    await sleep(PERIOD_MS + 100);
    handle.stop();

    expect(txSpy).toHaveBeenCalledWith(expect.any(Function));
    expect(exitSpy).not.toHaveBeenCalled();

    txSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("a missed-boundary wake emits the current period, not a replay of skipped ones", async () => {
    const bootPeriod = computePeriodId(Date.now(), seedConfig);
    const handle = await startSignalHubMockScheduler({
      db: signalHubDb,
      logger,
      seedConfig,
    });

    // Block the event loop synchronously past 5 period boundaries — the
    // scheduler's setTimeout cannot fire while this loop runs. Simulates a
    // debugger pause / OS suspend that drifts the host past several periods.
    const blockUntil = Date.now() + 5 * PERIOD_MS + 50;
    // eslint-disable-next-line no-empty
    while (Date.now() < blockUntil) {}

    // Yield so the single overdue timer can fire its catch-up wake.
    await sleep(50);
    handle.stop();

    const emitted = new Set((await readSignals()).map((r) => r.objectId));
    expect(objectIdsForPeriod(bootPeriod).every((id) => emitted.has(id))).toBe(
      true,
    );
    // The wake jumped straight to the period current when it fired (≥ boot + 5,
    // since we blocked past 5 boundaries): the boundaries skipped during the
    // block are NOT replayed one-for-one, so their object_ids never appear.
    for (const skipped of [bootPeriod + 1, bootPeriod + 2, bootPeriod + 3]) {
      expect(objectIdsForPeriod(skipped).some((id) => emitted.has(id))).toBe(
        false,
      );
    }
  });
});
