import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { readmodelEservice } from "@knodia/db-readmodel-eservice";

export type EserviceWriterService = ReturnType<
  typeof eserviceWriterServiceBuilder
>;

export function eserviceWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async insertEservice(): Promise<void> {
      await db
        .insert(readmodelEservice)
        .values([
          // TODO: populate with real data from event
        ])
        .onConflictDoNothing();
    },
  };
}
