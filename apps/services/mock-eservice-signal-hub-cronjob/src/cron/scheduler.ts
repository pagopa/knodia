import { type EserviceId } from "@knodia/common-models/ids";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { type Logger } from "pino";

import {
  computePeriodId,
  nextBoundaryMs,
  type SignalHubSeedConfig,
} from "../utils/rotation.ts";
import { type SignalIdAllocator } from "./counter.ts";
import { emitTransition } from "./emit.ts";

interface SchedulerDeps {
  allocator: SignalIdAllocator;
  db: NodePgDatabase;
  eserviceId: EserviceId;
  logger: Logger;
  seedConfig: SignalHubSeedConfig;
}

interface SchedulerHandle {
  stop: () => void;
}

// Boot = transition: emit immediately for the current periodId, then schedule
// the next emission at the next period boundary. On wake we recompute the
// current periodId from the wall clock (don't trust the timer fired exactly
// at the boundary — debugger pauses / OS suspends can drift us past one or
// more periods; we emit once for the latest period and reschedule).
export async function startScheduler(
  deps: SchedulerDeps,
): Promise<SchedulerHandle> {
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const emitNow = async () => {
    if (stopped) return;
    const now = Date.now();
    const periodId = computePeriodId(now, deps.seedConfig);
    const batch = await emitTransition({
      allocator: deps.allocator,
      db: deps.db,
      eserviceId: deps.eserviceId,
      now,
      periodId,
      seedConfig: deps.seedConfig,
    });
    deps.logger.info(
      `Emitted transition: periodId=${batch.periodId} ` +
        `signalIds=${batch.signalIds.join(",")} ` +
        `correlationId=${batch.correlationId}`,
    );
  };

  const scheduleNext = () => {
    if (stopped) return;
    const now = Date.now();
    const delay = Math.max(0, nextBoundaryMs(now, deps.seedConfig) - now);
    pendingTimer = setTimeout(() => {
      pendingTimer = undefined;
      void onWake();
    }, delay);
  };

  const onWake = async () => {
    if (stopped) return;
    try {
      await emitNow();
    } catch (err) {
      deps.logger.error(
        `Emit failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    scheduleNext();
  };

  await emitNow();
  scheduleNext();

  return {
    stop: () => {
      stopped = true;
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        pendingTimer = undefined;
      }
    },
  };
}
