import type { Agreement } from "@knodia/agreement-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { checkMetadataVersion } from "@knodia/db-readmodel-commons/utils";
import { eq } from "drizzle-orm";

import {
  readmodelAgreement,
  readmodelAgreementRequiredAttribute,
} from "../agreement.ts";
import { splitAgreementIntoObjectsSQL } from "../converters/splitters.ts";

function agreementWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async upsertAgreement(
      agreement: Agreement,
      metadataVersion: number,
    ): Promise<void> {
      const { agreementSQL, requiredAttributesSQL } =
        splitAgreementIntoObjectsSQL(agreement, metadataVersion);

      await db.transaction(async (tx) => {
        const shouldUpsert = await checkMetadataVersion(
          tx,
          readmodelAgreement,
          metadataVersion,
          agreement.id,
        );

        if (!shouldUpsert) {
          return;
        }

        await tx
          .delete(readmodelAgreement)
          .where(eq(readmodelAgreement.id, agreement.id));

        await tx.insert(readmodelAgreement).values(agreementSQL);

        if (requiredAttributesSQL.length > 0) {
          await tx
            .insert(readmodelAgreementRequiredAttribute)
            .values(requiredAttributesSQL);
        }
      });
    },
  };
}

// TODO: knip workaround
console.log(
  "🚀 ~ agreementWriterServiceBuilder ~ agreementWriterServiceBuilder:",
  agreementWriterServiceBuilder,
);
