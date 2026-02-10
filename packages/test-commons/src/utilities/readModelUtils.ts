import type { Eservice } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { checkMetadataVersion } from "@knodia/db-readmodel-commons";
import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "@knodia/db-readmodel-eservice";
import { splitEserviceIntoObjectsSQL } from "@knodia/db-readmodel-eservice/converters";
import { eq } from "drizzle-orm";

// TODO: maybe move the writer service to a shared location and block it with eslint
export async function upsertEservice(
  eservice: Eservice,
  metadataVersion: number,
  db: NodePgDatabase,
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
      eserviceSQL,
      eserviceVersionRequiredAttributesSQL,
      eserviceVersionsSQL,
    } = splitEserviceIntoObjectsSQL(eservice, metadataVersion);

    await tx.insert(readmodelEservice).values(eserviceSQL);

    if (eserviceVersionsSQL.length > 0) {
      await tx.insert(readmodelEserviceVersion).values(eserviceVersionsSQL);
    }

    if (eserviceInterfacesSQL.length > 0) {
      await tx.insert(readmodelEserviceInterface).values(eserviceInterfacesSQL);
    }

    if (eserviceCategoriesSQL.length > 0) {
      await tx.insert(readmodelEserviceCategory).values(eserviceCategoriesSQL);
    }

    if (eserviceVersionRequiredAttributesSQL.length > 0) {
      await tx
        .insert(readmodelEserviceVersionRequiredAttribute)
        .values(eserviceVersionRequiredAttributesSQL);
    }
  });
}
