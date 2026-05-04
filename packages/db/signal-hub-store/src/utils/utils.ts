import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { SignalHubStoreDbConfig } from "../config/config.ts";

export const makeSignalHubStoreDrizzleConnection = (
  config: SignalHubStoreDbConfig,
): { db: NodePgDatabase; pool: Pool } => {
  const pool = new Pool({
    database: config.signalHubStoreDbName,
    host: config.signalHubStoreDbHost,
    password: config.signalHubStoreDbPassword,
    port: config.signalHubStoreDbPort,
    ssl: config.signalHubStoreDbUseSsl
      ? { rejectUnauthorized: false }
      : undefined,
    user: config.signalHubStoreDbUser,
  });

  return { db: drizzle(pool), pool };
};
