import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { type signalHubDbConfig } from "../config/config.ts";

export const makeSignalHubDrizzleConnection = (
  config: typeof signalHubDbConfig,
): { db: NodePgDatabase; pool: Pool } => {
  const pool = new Pool({
    database: config.signalHubDbName,
    host: config.signalHubDbHost,
    password: config.signalHubDbPassword,
    port: config.signalHubDbPort,
    ssl: config.signalHubDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.signalHubDbUser,
  });

  return { db: drizzle(pool), pool };
};
