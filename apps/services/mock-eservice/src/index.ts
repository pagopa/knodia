import { startServer } from "@knodia/fastify-zod-api-commons/startServer";
import { createLogger } from "@knodia/logger";

import { buildAppFromConfig } from "./app.ts";
import { config } from "./config/config.ts";
import { startSignalHubMockEmitter } from "./signalHub/emitter/index.ts";
import { toSignalHubSeedConfig } from "./signalHub/seedEnvConfig.ts";

const logger = createLogger({ config });

void startServer(buildAppFromConfig(config), {
  host: config.host,
  port: config.port,
});

// Top-level await — a boot-time failure exits the process so the
// orchestrator restarts the service.
const emitter = await startSignalHubMockEmitter({
  dbConfig: config,
  logger,
  seedConfig: toSignalHubSeedConfig(config),
});

let shuttingDown = false;
const shutdown = async (reason: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Shutting down (${reason})`);
  emitter.stop();
  await emitter.dispose();
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
