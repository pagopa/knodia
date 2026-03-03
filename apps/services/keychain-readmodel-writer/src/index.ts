import { runConsumer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { config } from "./config/config.ts";
import { createProcessMessage } from "./utilities/utils.ts";

const pool = new Pool({
  database: config.readmodelDbName,
  host: config.readmodelDbHost,
  password: config.readmodelDbPassword,
  port: config.readmodelDbPort,
  ssl: config.readmodelDbUseSsl ? { rejectUnauthorized: false } : undefined,
  user: config.readmodelDbUser,
});

const readmodelDb = drizzle(pool);

const logger = createLogger({
  config,
  serviceName: "keychain-readmodel-writer",
});

await runConsumer(
  [config.consumerKeychainTopic],
  createProcessMessage(readmodelDb, logger),
  config,
  logger,
);
