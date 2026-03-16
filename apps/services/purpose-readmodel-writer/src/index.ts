import { runConsumer } from "@knodia/kafka-commons";
import { createLogger } from "@knodia/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { config } from "./config/config.ts";
import { createProcessMessage } from "./utils/utils.ts";

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
  serviceName: "purpose-readmodel-writer",
});

await runConsumer(
  [config.purposeTopic],
  createProcessMessage(readmodelDb, logger),
  config,
  logger,
);
