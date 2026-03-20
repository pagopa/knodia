import { EventStoreConfig } from "@knodia/db-event-store-config/config";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const makeEventStoreDrizzleConnection = (
  config: EventStoreConfig,
): { db: NodePgDatabase; pool: Pool } => {
  const pool = new Pool({
    database: config.eventStoreDbName,
    host: config.eventStoreDbHost,
    password: config.eventStoreDbPassword,
    port: config.eventStoreDbPort,
    ssl: config.eventStoreDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.eventStoreDbUser,
  });

  return { db: drizzle(pool), pool };
};
