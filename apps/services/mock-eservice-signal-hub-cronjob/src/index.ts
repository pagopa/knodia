import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { createLogger } from "@knodia/logger";

import { config } from "./config/config.ts";
import { loadMaxSignalId, makeSignalIdAllocator } from "./cron/counter.ts";
import { startScheduler } from "./cron/scheduler.ts";
import { createSignalHubDbConnection } from "./db/client.ts";

// Mockup 03 e-service id — kept in sync with the mock e-service router and
// the `scripts/seed/sql/<tenant>/mock-signal-hub-eservice.sql` seed.
const ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);

const logger = createLogger({ config });

const { db, pool } = createSignalHubDbConnection();

const maxSignalId = await loadMaxSignalId(db, ESERVICE_ID);
logger.info(
  `Loaded max(signal_id)=${maxSignalId} for eservice ${ESERVICE_ID}; ` +
    `next signal_id starts at ${maxSignalId + 1}`,
);

const allocator = makeSignalIdAllocator(maxSignalId);

const schedulerHandle = await startScheduler({
  allocator,
  db,
  eserviceId: ESERVICE_ID,
  logger,
  seedConfig: {
    expireSeconds: config.seedExpireSeconds,
    saltLength: config.seedSaltLength,
    startDateMs: config.seedStartDateMs,
  },
});

logger.info(
  `Signal Hub mock cron job started (period ${config.seedExpireSeconds}s, ` +
    `salt ${config.seedSaltLength}, startDateMs ${config.seedStartDateMs})`,
);

let stopped = false;
const shutdown = async (reason: string) => {
  if (stopped) return;
  stopped = true;
  logger.info(`Shutting down (${reason})`);
  schedulerHandle.stop();
  await pool.end();
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
