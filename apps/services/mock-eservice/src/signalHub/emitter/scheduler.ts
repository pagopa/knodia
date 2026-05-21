import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { type Logger } from "pino";

import { nextBoundaryMs, type SignalHubSeedConfig } from "../rotation.ts";
import { emitTransition } from "./emit.ts";

interface SchedulerDeps {
  db: NodePgDatabase;
  logger: Logger;
  seedConfig: SignalHubSeedConfig;
}

interface SchedulerHandle {
  stop: () => void;
}

export async function startScheduler(
  deps: SchedulerDeps,
): Promise<SchedulerHandle> {
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const emitNow = async () => {
    if (stopped) return;
    const batch = await emitTransition({
      db: deps.db,
      now: Date.now(),
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
        `Signal Hub emit failed, scheduling next: ${err instanceof Error ? err.message : String(err)}`,
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
