import type { EserviceId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Eservice } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import { aggregateEservice } from "../converters/aggregators.ts";
import { readmodelEservice, readmodelEserviceCategory } from "../eservice.ts";

export function eserviceReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getEServiceById(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<Eservice>> {
      const queryRes = await readmodelDb
        .select({
          category: readmodelEserviceCategory,
          eservice: readmodelEservice,
        })
        .from(readmodelEservice)
        .leftJoin(
          readmodelEserviceCategory,
          eq(readmodelEserviceCategory.eserviceId, readmodelEservice.id),
        )
        .where(eq(readmodelEservice.id, eserviceId));

      return aggregateEservice(queryRes);
    },
  };
}
