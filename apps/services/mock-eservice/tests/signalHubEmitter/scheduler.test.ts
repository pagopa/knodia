import { createTestLogger } from "@knodia/test-commons/utils";
import { describe, expect, it, vi } from "vitest";

import { startSignalHubMockScheduler } from "../../src/signalHub/emitter/scheduler.ts";
import { type SignalHubSeedConfig } from "../../src/signalHub/rotation.ts";
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
    const handle = await startSignalHubMockScheduler({
      db: signalHubDb,
      logger,
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
    const handle = await startSignalHubMockScheduler({
      db: signalHubDb,
      logger,
      seedConfig,
    });

    handle.stop();
    await sleep(3 * PERIOD_MS + 100);

    const rows = await readSignals();
    // Only the boot emission — no further transitions after stop().
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

    // Boot emit already succeeded. Force the next tick's insert to reject.
    const txSpy = vi
      .spyOn(signalHubDb, "transaction")
      .mockRejectedValue(new Error("simulated DB failure"));

    // Wait past at least one boundary so a tick fires.
    await sleep(PERIOD_MS + 100);
    handle.stop();

    expect(txSpy).toHaveBeenCalledWith(expect.any(Function));
    expect(exitSpy).not.toHaveBeenCalled();

    txSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("does not catch up on missed boundaries (one emit per actual wake)", async () => {
    const handle = await startSignalHubMockScheduler({
      db: signalHubDb,
      logger,
      seedConfig,
    });

    // Block the event loop synchronously across several period boundaries —
    // the scheduler's setTimeout cannot fire while this loop runs. Simulates
    // a debugger pause / OS suspend that drifts the host past N periods.
    const blockUntil = Date.now() + 5 * PERIOD_MS + 50;
    // eslint-disable-next-line no-empty
    while (Date.now() < blockUntil) {}

    // Yield once so any pending wake can fire.
    await sleep(50);
    handle.stop();

    const rows = await readSignals();
    const correlationIds = new Set(rows.map((r) => r.correlationId));
    // Not exactly 2: the count is timing-dependent (boot + however many
    // catch-up wakes fire during the post-block yield). The point of the
    // loose bound is that skipped boundaries are NOT replayed one-for-one,
    // which would produce 1 + 5 = 6 batches.
    expect(correlationIds.size).toBeLessThan(5);
  });
});
