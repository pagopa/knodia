import { runConsumer } from "@knodia/kafka-commons";
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

await runConsumer(
  [config.eserviceTopic],
  createProcessMessage(readmodelDb, config),
  config,
);
