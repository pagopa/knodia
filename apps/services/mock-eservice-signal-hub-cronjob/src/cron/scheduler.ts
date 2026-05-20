import { type EserviceId } from "@knodia/common-models/ids";
import {
  nextBoundaryMs,
  type SignalHubSeedConfig,
} from "@knodia/mock-eservice-signal-hub-commons/rotation";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { type Logger } from "pino";

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
//
// On a runtime emit failure we exit the process so the orchestrator restarts
// us. Boot then re-emits the missed period from a fresh `max(signal_id)`. We
// don't try to retry in-process: the in-memory `signal_id` allocator has
// already incremented before the failed insert, so an in-process retry would
// leave a permanent gap and silently drop the period.
export async function startScheduler(
  deps: SchedulerDeps,
): Promise<SchedulerHandle> {
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const emitNow = async () => {
    if (stopped) return;
    const now = Date.now();
    const batch = await emitTransition({
      allocator: deps.allocator,
      db: deps.db,
      eserviceId: deps.eserviceId,
      now,
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
      deps.logger.fatal(
        `Emit failed; exiting to let the orchestrator restart: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      process.exit(1);
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
