import { makeSignalHubDrizzleConnection } from "@knodia/db-signal-hub/utils";
import { createLogger } from "@knodia/logger";

import { config } from "./config/config.ts";
import { signalHubServiceBuilder } from "./services/signalHubService.ts";

const logger = createLogger({ config });

const { db: signalHubDb, pool: signalHubPool } =
  await makeSignalHubDrizzleConnection(config);
const signalHubService = signalHubServiceBuilder(signalHubDb, logger);

const shutdown = async (reason: string, exitCode = 0) => {
  logger.info(`Shutting down (${reason})`);
  await signalHubPool.end();
  process.exit(exitCode);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

try {
  await signalHubService.cleanup(config.signalsRetentionHours);
  await shutdown("Signals cleanup finished", 0);
} catch (error) {
  logger.error({ err: error }, "Error during signals cleanup");
  await shutdown("Signals cleanup failed", 1);
}
