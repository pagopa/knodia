import { makeReadmodelDrizzleConnection } from "@knodia/db-readmodel-commons/utils";
import { runConsumer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";

import { config } from "./config/config.ts";
import { createProcessMessage } from "./utils/utils.ts";

const { db: readmodelDb } = makeReadmodelDrizzleConnection(config);

const logger = createLogger({
  config,
  serviceName: "keychain-readmodel-writer",
});

await runConsumer(
  [config.keychainTopic],
  createProcessMessage(readmodelDb, logger),
  config,
  logger,
);
