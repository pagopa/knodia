import { initFileManager } from "@knodia/file-manager";
import { runConsumer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";

import { config } from "./config/config.ts";
import { type SignupArchiverDeps } from "./services/consumerService.ts";
import { createProcessMessage } from "./utils/utils.ts";

const logger = createLogger({
  config,
});

const deps: SignupArchiverDeps = {
  bucket: config.signupArchivesS3Bucket,
  fileManager: initFileManager(),
};

await runConsumer(
  [config.signupTopic],
  createProcessMessage(deps, logger),
  config,
  logger,
);
