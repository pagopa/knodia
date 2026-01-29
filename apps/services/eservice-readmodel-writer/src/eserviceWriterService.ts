import type { Eservice } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  type EserviceSQL,
  readmodelEservice,
} from "@knodia/db-readmodel-eservice";

export type EserviceWriterService = ReturnType<
  typeof eserviceWriterServiceBuilder
>;

export function eserviceWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async insertEservice(
      eservice: Eservice,
      metadataVersion: number,
    ): Promise<void> {
      // TODO: split other sub-entities
      const eserviceSQL: EserviceSQL = {
        ...eservice,
        metadataVersion,
      };

      await db
        .insert(readmodelEservice)
        .values(eserviceSQL)
        .onConflictDoNothing();
    },
  };
}
