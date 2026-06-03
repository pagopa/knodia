import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { checkMetadataVersion } from "@knodia/db-readmodel-commons/utils";
import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEservicePurposeFormOptions,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "@knodia/db-readmodel-eservice";
import { splitEserviceIntoObjectsSQL } from "@knodia/db-readmodel-eservice/converters";
import { type Eservice } from "@knodia/eservice-models";
import { eq } from "drizzle-orm";

export type EserviceWriterService = ReturnType<
  typeof eserviceWriterServiceBuilder
>;

export function eserviceWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async upsertEservice(
      eservice: Eservice,
      metadataVersion: number,
    ): Promise<void> {
      return db.transaction(async (tx) => {
        const shouldUpsert = await checkMetadataVersion(
          tx,
          readmodelEservice,
          metadataVersion,
          eservice.id,
        );

        if (!shouldUpsert) {
          return;
        }

        await tx
          .delete(readmodelEservice)
          .where(eq(readmodelEservice.id, eservice.id));

        const {
          eserviceCategoriesSQL,
          eserviceInterfacesSQL,
          eservicePurposeFormOptionsSQL,
          eserviceSQL,
          eserviceVersionRequiredAttributesSQL,
          eserviceVersionsSQL,
        } = splitEserviceIntoObjectsSQL(eservice, metadataVersion);

        await tx.insert(readmodelEservice).values(eserviceSQL);

        if (eserviceVersionsSQL.length > 0) {
          await tx.insert(readmodelEserviceVersion).values(eserviceVersionsSQL);
        }

        if (eserviceInterfacesSQL.length > 0) {
          await tx
            .insert(readmodelEserviceInterface)
            .values(eserviceInterfacesSQL);
        }

        if (eserviceCategoriesSQL.length > 0) {
          await tx
            .insert(readmodelEserviceCategory)
            .values(eserviceCategoriesSQL);
        }

        if (eserviceVersionRequiredAttributesSQL.length > 0) {
          await tx
            .insert(readmodelEserviceVersionRequiredAttribute)
            .values(eserviceVersionRequiredAttributesSQL);
        }

        if (eservicePurposeFormOptionsSQL.length > 0) {
          await tx
            .insert(readmodelEservicePurposeFormOptions)
            .values(eservicePurposeFormOptionsSQL);
        }
      });
    },
  };
}
