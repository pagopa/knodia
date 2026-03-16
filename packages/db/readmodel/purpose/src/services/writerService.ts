import type { Purpose } from "@knodia/purpose-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { checkMetadataVersion } from "@knodia/db-readmodel-commons/utils";
import { eq } from "drizzle-orm";

import { toPurposeSQL } from "../converters/splitters.ts";
import { readmodelPurpose } from "../purpose.ts";

export type PurposeWriterService = ReturnType<
  typeof purposeWriterServiceBuilder
>;

export function purposeWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async upsertPurpose(
      purpose: Purpose,
      metadataVersion: number,
    ): Promise<void> {
      const purposeSQL = toPurposeSQL(purpose, metadataVersion);

      await db.transaction(async (tx) => {
        const shouldUpsert = await checkMetadataVersion(
          tx,
          readmodelPurpose,
          metadataVersion,
          purpose.id,
        );

        if (!shouldUpsert) {
          return;
        }

        await tx
          .delete(readmodelPurpose)
          .where(eq(readmodelPurpose.id, purpose.id));

        await tx.insert(readmodelPurpose).values(purposeSQL);
      });
    },
  };
}
