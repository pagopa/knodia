import type { PurposeId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { purposeReadmodelServiceBuilder } from "@knodia/db-readmodel-purpose/services";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const purposeReadmodelService = purposeReadmodelServiceBuilder(readmodelDb);
  return {
    async getPurpose(purposeId: PurposeId) {
      return await purposeReadmodelService.getPurposeById(purposeId);
    },
  };
}
