import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export interface DbConnectionOptions {
  checkDbConnection?: boolean;
}

interface DbConnectionConfig {
  database: string;
  host: string;
  password: string;
  port: number;
  user: string;
  useSsl: boolean;
}

// Bounds both the startup check and later lazy reconnects; pg's default is
// infinite, which would defeat the fail-fast guarantee on a blackholed host.
const CONNECTION_TIMEOUT_MS = 10_000;

export async function makeDrizzleConnection(
  { useSsl, ...poolConfig }: DbConnectionConfig,
  { checkDbConnection = true }: DbConnectionOptions = {},
): Promise<{ db: NodePgDatabase; pool: Pool }> {
  const pool = new Pool({
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    ...poolConfig,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

  // The pg pool connects lazily, so bad credentials or an unreachable database
  // would only surface on the first query: ping at startup to fail fast
  // instead. Configurable through checkDbConnection so OpenAPI codegen can opt out.
  if (checkDbConnection) {
    try {
      await pool.query("SELECT 1");
    } catch (error) {
      throw new Error(
        `Startup connection check to database "${poolConfig.database}" at ${poolConfig.host}:${poolConfig.port} failed`,
        { cause: error },
      );
    }
  }

  return { db: drizzle(pool), pool };
}
