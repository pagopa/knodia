import { makeReadmodelDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
import { ReadmodelConfig } from "@knodia/db-readmodel-config/config";
import { runConsumer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";

import { config } from "./config/config.ts";
import { createProcessMessage } from "./utils/utils.ts";

const { db: readmodelDb, pool: readmodelPool } = makeReadmodelDrizzleConnection(
  ReadmodelConfig.parse(config),
);

const logger = createLogger({
  config,
  serviceName: "eservice-readmodel-writer",
});

await runConsumer(
  [config.eserviceTopic],
  createProcessMessage(readmodelDb, logger),
  config,
  logger,
  readmodelPool,
);
