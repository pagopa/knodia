import type { Eservice } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { readmodelEservice } from "@knodia/db-readmodel-eservice";

export type EserviceWriterService = ReturnType<
  typeof eserviceWriterServiceBuilder
>;

export function eserviceWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async upsertEservice(eservice: Eservice): Promise<void> {
      await db
        .insert(readmodelEservice)
        .values({ id: eservice.id })
        .onConflictDoNothing();
    },
  };
}
