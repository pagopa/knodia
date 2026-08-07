import type { Pool } from "pg";

// The pg pool connects lazily, so bad credentials or an unreachable database
// would only surface on the first query: ping at startup to fail fast instead.
export async function assertDbConnection(
  pool: Pool,
  dbName: string,
): Promise<void> {
  try {
    await pool.query("SELECT 1");
  } catch (error) {
    throw new Error(`Startup connection check to the ${dbName} DB failed`, {
      cause: error,
    });
  }
}
