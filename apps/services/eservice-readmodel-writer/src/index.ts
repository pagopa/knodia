import { runConsumer } from "@knodia/kafka-commons";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { config } from "./config/config.ts";
import { createProcessMessage } from "./utilities/utils.ts";

const pool = new Pool({
  database: config.readModelDbName,
  host: config.readModelDbHost,
  password: config.readModelDbPassword,
  port: config.readModelDbPort,
  ssl: config.readModelDbUseSsl ? { rejectUnauthorized: false } : undefined,
  user: config.readModelDbUser,
});

const readmodelDb = drizzle(pool);

await runConsumer(
  [config.eserviceTopic],
  createProcessMessage(readmodelDb),
  config,
);
