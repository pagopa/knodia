import type { Eservice } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { readmodelEservice } from "@knodia/db-readmodel-eservice";
import { eq } from "drizzle-orm";

export type EserviceWriterService = ReturnType<
  typeof eserviceWriterServiceBuilder
>;

export function eserviceWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async deleteEservice(id: string): Promise<void> {
      await db.delete(readmodelEservice).where(eq(readmodelEservice.id, id));
    },

    async upsertEservice(eservice: Eservice): Promise<void> {
      await db
        .insert(readmodelEservice)
        .values({ id: eservice.id })
        .onConflictDoNothing();
    },
  };
}
