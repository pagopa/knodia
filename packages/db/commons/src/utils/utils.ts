import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client, type ClientConfig, Pool } from "pg";

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

// pg waits forever by default: a host that silently drops packets (e.g. a
// firewall rule) would hang startup instead of failing it.
const CONNECTION_TIMEOUT_MS = 10_000;

export async function makeDrizzleConnection(
  { useSsl, ...connectionConfig }: DbConnectionConfig,
  { checkDbConnection = true }: DbConnectionOptions = {},
): Promise<{ db: NodePgDatabase; pool: Pool }> {
  const clientConfig: ClientConfig = {
    ...connectionConfig,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  };

  // The pg pool connects lazily, so bad credentials or an unreachable database
  // would only surface on the first query: ping at startup to fail fast
  // instead. Configurable through checkDbConnection so OpenAPI codegen can opt out.
  if (checkDbConnection) {
    await checkConnection(clientConfig);
  }

  const pool = new Pool(clientConfig);
  return { db: drizzle(pool), pool };
}

// A dedicated client rather than the pool: on a pool, connectionTimeoutMillis
// would also cap how long queries wait for a free connection.
async function checkConnection(config: ClientConfig): Promise<void> {
  const client = new Client({
    ...config,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
  } catch (error) {
    throw new Error(
      `Startup connection check to database "${config.database}" at ${config.host}:${config.port} failed`,
      { cause: error },
    );
  } finally {
    await client.end();
  }
}
