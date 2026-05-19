import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { config } from "../config/config.ts";

interface SignalHubDb {
  db: NodePgDatabase;
  pool: Pool;
}

export function createSignalHubDbConnection(): SignalHubDb {
  const pool = new Pool({
    database: config.signalHubDbName,
    host: config.signalHubDbHost,
    password: config.signalHubDbPassword,
    port: config.signalHubDbPort,
    ssl: config.signalHubDbUseSsl,
    user: config.signalHubDbUser,
  });
  return { db: drizzle(pool), pool };
}
