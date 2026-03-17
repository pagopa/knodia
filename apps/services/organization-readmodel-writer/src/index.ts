import { makeReadmodelDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
import { runConsumer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";

import { config } from "./config/config.ts";
import { createProcessMessage } from "./utils/utils.ts";

const { db: readmodelDb, pool: readmodelPool } =
  makeReadmodelDrizzleConnection(config);

const logger = createLogger({
  config,
  serviceName: "organization-readmodel-writer",
});

await runConsumer(
  [config.organizationTopic],
  createProcessMessage(readmodelDb, logger),
  config,
  logger,
  readmodelPool,
);
