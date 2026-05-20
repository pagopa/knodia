import { makeSignalHubDrizzleConnection } from "@knodia/db-signal-hub/utils";
import { type Logger } from "pino";

import { SIGNAL_HUB_MOCK_ESERVICE_ID } from "../mockup.ts";
import { type SignalHubSeedConfig } from "../rotation.ts";
import { loadMaxSignalId, makeSignalIdAllocator } from "./counter.ts";
import { startScheduler } from "./scheduler.ts";

interface SignalHubEmitterHandle {
  dispose: () => Promise<void>;
  stop: () => void;
}

interface StartParams {
  dbConfig: Parameters<typeof makeSignalHubDrizzleConnection>[0];
  logger: Logger;
  seedConfig: SignalHubSeedConfig;
}

// Boot the in-process Signal Hub emitter:
// - open a Drizzle pool against the Signal Hub DB,
// - read max(signal_id) for the mock e-service and seed the in-memory
//   allocator,
// - run a boot transition + setTimeout loop.
// Boot-time failures (DB unreachable, max-signal-id read failure, boot emit
// failure) propagate as a rejected promise — the caller's top-level await
// then exits the process so the orchestrator restarts the service.
export async function startSignalHubEmitter({
  dbConfig,
  logger,
  seedConfig,
}: StartParams): Promise<SignalHubEmitterHandle> {
  const { db, pool } = makeSignalHubDrizzleConnection(dbConfig);

  const maxSignalId = await loadMaxSignalId(db, SIGNAL_HUB_MOCK_ESERVICE_ID);
  logger.info(
    `Loaded max(signal_id)=${maxSignalId} for eservice ${SIGNAL_HUB_MOCK_ESERVICE_ID}; ` +
      `next signal_id starts at ${maxSignalId + 1}`,
  );

  const allocator = makeSignalIdAllocator(maxSignalId);

  const schedulerHandle = await startScheduler({
    allocator,
    db,
    eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
    logger,
    seedConfig,
  });

  logger.info(
    `Signal Hub emitter started (period ${seedConfig.expireSeconds}s, ` +
      `salt ${seedConfig.saltLength}, startDateMs ${seedConfig.startDateMs})`,
  );

  return {
    dispose: () => pool.end(),
    stop: schedulerHandle.stop,
  };
}
