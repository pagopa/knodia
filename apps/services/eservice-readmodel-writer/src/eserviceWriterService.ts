import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";

import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "@knodia/db-readmodel-eservice";
import {
  type Eservice,
  splitEserviceIntoObjectsSQL,
} from "@knodia/eservice-models";
import { genericError } from "@knodia/fastify-zod-api-commons/models";
import { eq, SQL } from "drizzle-orm";

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
        // TODO: move to a shared utility package
        const checkMetadataVersion = async (
          tx: NodePgDatabase,
          table: AnyPgTable & {
            id: AnyPgColumn;
            metadataVersion: AnyPgColumn<{ data: number }>;
          },
          metadataVersion: number,
          id: string,
        ): Promise<boolean> =>
          await checkMetadataVersionByFilter(
            tx,
            table,
            metadataVersion,
            eq(table.id, id),
          );
        const checkMetadataVersionByFilter = async (
          tx: NodePgDatabase,
          table: AnyPgTable & {
            metadataVersion: AnyPgColumn<{ data: number }>;
          },
          metadataVersion: number,
          filter: SQL | undefined,
        ): Promise<boolean> => {
          if (filter === undefined) {
            throw genericError("Filter cannot be undefined");
          }
          const [row] = await tx
            .select({
              metadataVersion: table.metadataVersion,
            })
            .from(table as AnyPgTable)
            .where(filter);

          const existingMetadataVersion = row?.metadataVersion;

          if (existingMetadataVersion == null) {
            return true;
          }
          return existingMetadataVersion <= metadataVersion;
        };

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

        for (const eserviceVersion of eserviceVersionsSQL) {
          await tx.insert(readmodelEserviceVersion).values(eserviceVersion);
        }

        for (const eserviceInterface of eserviceInterfacesSQL) {
          await tx.insert(readmodelEserviceInterface).values(eserviceInterface);
        }

        for (const category of eserviceCategoriesSQL) {
          await tx.insert(readmodelEserviceCategory).values(category);
        }

        for (const attribute of eserviceVersionRequiredAttributesSQL) {
          await tx
            .insert(readmodelEserviceVersionRequiredAttribute)
            .values(attribute);
        }
      });
    },
  };
}
