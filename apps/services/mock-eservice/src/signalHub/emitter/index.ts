import { makeSignalHubDrizzleConnection } from "@knodia/db-signal-hub/utils";
import { type Logger } from "pino";

import { type SignalHubSeedConfig } from "../rotation.ts";
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

export async function startSignalHubEmitter({
  dbConfig,
  logger,
  seedConfig,
}: StartParams): Promise<SignalHubEmitterHandle> {
  const { db, pool } = makeSignalHubDrizzleConnection(dbConfig);

  const schedulerHandle = await startScheduler({ db, logger, seedConfig });

  logger.info(
    `Signal Hub emitter started (period ${seedConfig.expireSeconds}s, ` +
      `salt ${seedConfig.saltLength}, startDateMs ${seedConfig.startDateMs})`,
  );

  return {
    dispose: () => pool.end(),
    stop: schedulerHandle.stop,
  };
}
