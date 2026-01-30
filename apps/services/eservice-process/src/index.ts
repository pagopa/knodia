import { startServer } from "@knodia/fastify-zod-api-commons/startServer";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import buildApp from "./app.ts";
import { config } from "./config/config.ts";

const pool = new Pool({
  database: config.eventStoreDbName,
  host: config.eventStoreDbHost,
  password: config.eventStoreDbPassword,
  port: config.eventStoreDbPort,
  ssl: config.eventStoreDbUseSsl ? { rejectUnauthorized: false } : undefined,
  user: config.eventStoreDbUser,
});

const eventStoreDb = drizzle(pool);

const app = buildApp({
  eventStoreDb,
  loggerConfig: config,
  serviceName: config.serviceName,
});
app.addHook("onClose", async () => {
  await pool.end();
});

void startServer(app, { host: config.host, port: config.port });
