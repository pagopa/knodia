import { makeReadmodelDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
import { runConsumer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";

import { config } from "./config/config.ts";
import { createProcessMessage } from "./utils/utils.ts";

const logger = createLogger({
  config,
});

const { db: readmodelDb, pool: readmodelPool } =
  await makeReadmodelDrizzleConnection(config).catch((error: unknown) => {
    logger.error({ err: error }, "Failed to start service");
    return process.exit(1);
  });

await runConsumer(
  [config.purposeTopic],
  createProcessMessage(readmodelDb, logger),
  config,
  logger,
  () => readmodelPool.end(),
);
