import type { EserviceId, EserviceVersionId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { type Eservice } from "@knodia/eservice-models";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  return {
    async getEservice(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<Eservice>> {
      return await eserviceReadmodelService.getEServiceById(eserviceId);
    },
    async getEserviceVersion(
      eserviceId: EserviceId,
      eserviceVersionId: EserviceVersionId,
    ) {
      return await eserviceReadmodelService.getEServiceVersionById(
        eserviceId,
        eserviceVersionId,
      );
    },
  };
}
