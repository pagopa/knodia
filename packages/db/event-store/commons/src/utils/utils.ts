import { assertDbConnection } from "@knodia/db-commons/utils";
import { type EventStoreConfig } from "@knodia/db-event-store-config/config";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const makeEventStoreDrizzleConnection = async (
  config: EventStoreConfig,
  options: { checkConnection?: boolean } = {},
): Promise<{ db: NodePgDatabase; pool: Pool }> => {
  const pool = new Pool({
    database: config.eventStoreDbName,
    host: config.eventStoreDbHost,
    password: config.eventStoreDbPassword,
    port: config.eventStoreDbPort,
    ssl: config.eventStoreDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.eventStoreDbUser,
  });

  if (options.checkConnection ?? true) {
    await assertDbConnection(pool, "event-store");
  }

  return { db: drizzle(pool), pool };
};
