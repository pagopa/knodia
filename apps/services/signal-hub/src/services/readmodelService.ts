import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";

import { readmodelEservice } from "@knodia/db-readmodel-eservice";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { and, eq } from "drizzle-orm";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  return {
    async getEserviceByIdAndProducerId(
      eserviceId: EserviceId,
      producerId: OrganizationId,
    ) {
      return await eserviceReadmodelService.getEserviceByFilter(
        and(
          eq(readmodelEservice.id, eserviceId),
          eq(readmodelEservice.producerId, producerId),
        ),
      );
    },
  };
}
