import { runConsumer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";

import { config } from "./config/config.ts";
import { createProcessMessage } from "./utils/utils.ts";

const logger = createLogger({
  config,
});

await runConsumer(
  [config.signupTopic],
  createProcessMessage(logger),
  config,
  logger,
);
