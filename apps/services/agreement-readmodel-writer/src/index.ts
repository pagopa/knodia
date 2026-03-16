import { makeDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
import { ReadmodelConfig } from "@knodia/db-readmodel-config/config";
import { runConsumer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";

import { config } from "./config/config.ts";
import { createProcessMessage } from "./utils/utils.ts";

const { db: readmodelDb } = makeDrizzleConnection(
  ReadmodelConfig.parse(config),
);

const logger = createLogger({
  config,
  serviceName: "agreement-readmodel-writer",
});

await runConsumer(
  [config.agreementTopic],
  createProcessMessage(readmodelDb, logger),
  config,
  logger,
);
