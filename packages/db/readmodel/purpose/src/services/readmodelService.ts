import type { PurposeId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Purpose } from "@knodia/purpose-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import { toPurpose } from "../converters/converters.ts";
import { readmodelPurpose } from "../purpose.ts";

export function purposeReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getPurposeById(
      purposeId: PurposeId,
    ): Promise<undefined | WithMetadata<Purpose>> {
      const queryRes = await readmodelDb
        .select()
        .from(readmodelPurpose)
        .where(eq(readmodelPurpose.id, purposeId));

      const [first] = queryRes;
      if (!first) {
        return undefined;
      }

      return toPurpose(first);
    },
  };
}
