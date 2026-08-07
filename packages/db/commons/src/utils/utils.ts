import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

export interface DbConnectionOptions {
  checkDbConnection?: boolean;
}

// Bounds both the startup check and later lazy reconnects; pg's default is
// infinite, which would defeat the fail-fast guarantee on a blackholed host.
const CONNECTION_TIMEOUT_MS = 10_000;

export async function makeDrizzleConnection(
  poolConfig: PoolConfig,
  dbName: string,
  { checkDbConnection = true }: DbConnectionOptions = {},
): Promise<{ db: NodePgDatabase; pool: Pool }> {
  const pool = new Pool({
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    ...poolConfig,
  });

  // The pg pool connects lazily, so bad credentials or an unreachable database
  // would only surface on the first query: ping at startup to fail fast
  // instead. OpenAPI codegen opts out — it runs without a database.
  if (checkDbConnection) {
    try {
      await pool.query("SELECT 1");
    } catch (error) {
      throw new Error(`Startup connection check to the ${dbName} DB failed`, {
        cause: error,
      });
    }
  }

  return { db: drizzle(pool), pool };
}
