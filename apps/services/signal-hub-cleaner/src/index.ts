import { makeSignalHubDrizzleConnection } from "@knodia/db-signal-hub/utils";
import { createLogger } from "@knodia/logger";

import { config } from "./config/config.ts";
import { signalHubServiceBuilder } from "./services/signalHubService.ts";

const logger = createLogger({ config });

const { db: signalHubDb, pool: signalHubPool } =
  makeSignalHubDrizzleConnection(config);
const signalHubService = signalHubServiceBuilder(signalHubDb, logger);

const shutdown = async (reason: string, exitCode = 0) => {
  logger.info(`Shutting down (${reason})`);
  await signalHubPool.end();
  process.exit(exitCode);
};

try {
  await signalHubService.cleanup(config.signalsRetentionHours);
  await shutdown("Signals cleanup finished", 0);
} catch (error) {
  if (error instanceof Error) {
    logger.error(`Error during signals cleanup: ${error.message}`);
  } else {
    logger.error(`Unknown error during signals cleanup: ${error}`);
  }

  await shutdown("Signals cleanup failed", 1);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
