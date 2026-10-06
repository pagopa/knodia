import { initRedisRateLimiter } from "@knodia/fastify-zod-api-commons/rate-limit";
import { startServer } from "@knodia/fastify-zod-api-commons/startServer";
import { createLogger, exitOnStartupFailure } from "@knodia/logger";

import { buildAppFromConfig } from "./app.ts";
import { config } from "./config/config.ts";
import { startSignalHubMockEmitter } from "./signalHub/emitter/index.ts";
import { toSignalHubSeedConfig } from "./signalHub/seedEnvConfig.ts";

const logger = createLogger({ config });

const rateLimiter = initRedisRateLimiter({
  config,
  knodeId: config.knodeId,
  logger,
  serviceName: "mock-eservice",
});

// The emitter, not buildAppFromConfig, is what touches the DB, so start it
// (and its startup connection check) before the server: a bad DB connection
// then fails the boot before the HTTP server comes up.
const emitter = await exitOnStartupFailure(
  startSignalHubMockEmitter({
    dbConfig: config,
    logger,
    seedConfig: toSignalHubSeedConfig(config),
  }),
  logger,
);

void startServer(buildAppFromConfig(config, rateLimiter), {
  host: config.host,
  loggerConfig: config,
  port: config.port,
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
