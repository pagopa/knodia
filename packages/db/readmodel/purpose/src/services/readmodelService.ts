import type { PurposeId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Purpose } from "@knodia/purpose-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import { aggregatePurpose } from "../converters/aggregators.ts";
import { readmodelPurpose } from "../purpose.ts";

export function purposeReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getPurposeById(
      purposeId: PurposeId,
    ): Promise<undefined | WithMetadata<Purpose>> {
      const queryRes = await readmodelDb
        .select({
          purpose: readmodelPurpose,
        })
        .from(readmodelPurpose)
        .where(eq(readmodelPurpose.id, purposeId));

      return aggregatePurpose(queryRes);
    },
  };
}
