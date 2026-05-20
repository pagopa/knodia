import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { describe, expect, it, vi } from "vitest";

import { startCleaner } from "../src/services/cleaner.ts";
import { logger, signalHubDb } from "./setup.ts";
import { getAllSignals, seedSignals } from "./utils.ts";

const SIGNALS_RETENTION_HOURS = 24;

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

describe("Signal Hub Cleaner", () => {
  it("deletes signals older than the retention period and keeps newer ones", async () => {
    await seedSignals([
      { createdAt: hoursAgo(36), objectId: "old-1" },
      { createdAt: hoursAgo(24), objectId: "old-2" },
      { createdAt: hoursAgo(1), objectId: "recent-1" },
      { createdAt: hoursAgo(2), objectId: "recent-2" },
    ]);

    await startCleaner({
      logger,
      signalHubDb,
      signalsRetentionHours: SIGNALS_RETENTION_HOURS,
    });

    const remainingSignals = await getAllSignals();
    expect(remainingSignals).toHaveLength(2);
    expect(remainingSignals.map((s) => s.objectId)).toEqual(
      expect.arrayContaining(["recent-1", "recent-2"]),
    );
  });

  it("deletes no signals when all are within the retention period", async () => {
    await seedSignals([
      { createdAt: hoursAgo(1), objectId: "recent-1" },
      { createdAt: hoursAgo(2), objectId: "recent-2" },
    ]);

    await startCleaner({
      logger,
      signalHubDb,
      signalsRetentionHours: SIGNALS_RETENTION_HOURS,
    });

    const remainingSignals = await getAllSignals();
    expect(remainingSignals).toHaveLength(2);
  });

  it("deletes all signals when all are older than the retention period", async () => {
    await seedSignals([
      { createdAt: hoursAgo(48), objectId: "old-1" },
      { createdAt: hoursAgo(72), objectId: "old-2" },
    ]);

    await startCleaner({
      logger,
      signalHubDb,
      signalsRetentionHours: SIGNALS_RETENTION_HOURS,
    });

    const remainingSignals = await getAllSignals();
    expect(remainingSignals).toHaveLength(0);
  });

  it("does nothing when the table is empty", async () => {
    await startCleaner({
      logger,
      signalHubDb,
      signalsRetentionHours: SIGNALS_RETENTION_HOURS,
    });

    const remainingSignals = await getAllSignals();
    expect(remainingSignals).toHaveLength(0);
  });

  it("propagates database errors", async () => {
    const brokenDb = {
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("DB connection error")),
      }),
    } as unknown as NodePgDatabase;

    await expect(
      startCleaner({
        logger,
        signalHubDb: brokenDb,
        signalsRetentionHours: SIGNALS_RETENTION_HOURS,
      }),
    ).rejects.toThrow("DB connection error");
  });
});
