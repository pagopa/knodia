import type { EserviceId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { CompactEservice } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq, getTableColumns } from "drizzle-orm";

import { toCompactEservice } from "../converters/converters.ts";
import { readmodelEservice } from "../eservice.ts";

export type EserviceReadmodelService = ReturnType<
  typeof eserviceReadmodelServiceBuilder
>;

export function eserviceReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getEServiceById(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<CompactEservice>> {
      const queryResult = await readmodelDb
        .select(getTableColumns(readmodelEservice))
        .from(readmodelEservice)
        .where(eq(readmodelEservice.id, eserviceId));

      const eserviceSQL = queryResult[0];
      if (!eserviceSQL) {
        return undefined;
      }

      return toCompactEservice(eserviceSQL);
    },
  };
}
