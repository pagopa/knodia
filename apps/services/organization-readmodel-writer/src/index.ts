import { makeReadmodelDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
import { runConsumer } from "@knodia/kafka-commons";
import { createLogger, exitOnStartupFailure } from "@knodia/logger";

import { config } from "./config/config.ts";
import { createProcessMessage } from "./utils/utils.ts";

const logger = createLogger({
  config,
});

const { db: readmodelDb, pool: readmodelPool } = await exitOnStartupFailure(
  makeReadmodelDrizzleConnection(config),
  logger,
);

await runConsumer(
  [config.organizationTopic],
  createProcessMessage(readmodelDb, logger),
  config,
  logger,
  () => readmodelPool.end(),
);
