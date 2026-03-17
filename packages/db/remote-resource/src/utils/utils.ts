import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { RemoteResourceDbConfig } from "../config.ts";

export const makeRemoteResourceDrizzleConnection = (
  config: RemoteResourceDbConfig,
): { db: NodePgDatabase; pool: Pool } => {
  const pool = new Pool({
    database: config.remoteResourceDbName,
    host: config.remoteResourceDbHost,
    password: config.remoteResourceDbPassword,
    port: config.remoteResourceDbPort,
    ssl: config.remoteResourceDbUseSsl
      ? { rejectUnauthorized: false }
      : undefined,
    user: config.remoteResourceDbUser,
  });

  return { db: drizzle(pool), pool };
};
