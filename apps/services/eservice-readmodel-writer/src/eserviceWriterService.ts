import type { Eservice } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { readmodelEservice } from "@knodia/db-readmodel-eservice";

import type { EserviceV1 } from "../../../../packages/models/eservice-models/src/generated/v1/eservice.ts";

export type EserviceWriterService = ReturnType<
  typeof eserviceWriterServiceBuilder
>;

export function eserviceWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async insertEservice(eservice: EserviceV1): Promise<void> {
      await db
        .insert(readmodelEservice)
        .values({ id: eservice.id })
        .onConflictDoNothing();
    },
  };
}
