import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { AnyPgTable } from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

export async function resetTestDatabase(
  db: NodePgDatabase,
  ...tables: AnyPgTable[]
): Promise<void> {
  if (tables.length === 0) {
    return;
  }

  await db.execute(
    sql`TRUNCATE TABLE ${sql.join(tables, sql.raw(", "))} RESTART IDENTITY CASCADE`,
  );
}
