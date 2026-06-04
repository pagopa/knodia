import type { ProducerKeychainId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  checkMetadataVersion,
  updateMetadataVersionInTables,
} from "@knodia/db-readmodel-commons/utils";
import {
  type ProducerKeychain,
  type ProducerKeychainEservice,
} from "@knodia/keychain-models";
import { and, eq, lte } from "drizzle-orm";

import {
  splitProducerKeychainIntoObjectsSQL,
  toProducerKeychainEserviceSQL,
} from "../converters/producerKeychainSplitters.ts";
import {
  producerKeychainSubTables,
  producerKeychainTables,
  readmodelProducerKeychain,
  readmodelProducerKeychainEservice,
  readmodelProducerKeychainKey,
  readmodelProducerKeychainUser,
} from "../producerKeychain.ts";

export type ProducerKeychainWriterService = ReturnType<
  typeof producerKeychainWriterServiceBuilder
>;

export function producerKeychainWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async deleteProducerKeychain(
      producerKeychainId: ProducerKeychainId,
      metadataVersion: number,
    ): Promise<void> {
      await db
        .delete(readmodelProducerKeychain)
        .where(
          and(
            eq(readmodelProducerKeychain.id, producerKeychainId),
            lte(readmodelProducerKeychain.metadataVersion, metadataVersion),
          ),
        );
    },
    async deleteProducerKeychainEservice(
      producerKeychainEservice: Omit<ProducerKeychainEservice, "linkedAt">,
      metadataVersion: number,
    ): Promise<void> {
      return db.transaction(async (tx) => {
        const shouldDelete = await checkMetadataVersion(
          tx,
          readmodelProducerKeychain,
          metadataVersion,
          producerKeychainEservice.producerKeychainId,
        );

        if (!shouldDelete) {
          return;
        }

        await tx
          .delete(readmodelProducerKeychainEservice)
          .where(
            and(
              eq(
                readmodelProducerKeychainEservice.producerKeychainId,
                producerKeychainEservice.producerKeychainId,
              ),
              eq(
                readmodelProducerKeychainEservice.eserviceId,
                producerKeychainEservice.eserviceId,
              ),
              lte(
                readmodelProducerKeychainEservice.metadataVersion,
                metadataVersion,
              ),
            ),
          );

        await updateMetadataVersionInTables({
          db: tx,
          getIdColumn: (table) => {
            if ("producerKeychainId" in table) {
              return table.producerKeychainId;
            }
            return table.id;
          },
          id: producerKeychainEservice.producerKeychainId,
          newMetadataVersion: metadataVersion,
          tables: producerKeychainTables,
        });
      });
    },
    async upsertProducerKeychain(
      producerKeychain: ProducerKeychain,
      metadataVersion: number,
    ): Promise<void> {
      return db.transaction(async (tx) => {
        const shouldUpsert = await checkMetadataVersion(
          tx,
          readmodelProducerKeychain,
          metadataVersion,
          producerKeychain.id,
        );

        if (!shouldUpsert) {
          return;
        }

        await Promise.all(
          producerKeychainSubTables.map((table) =>
            tx
              .delete(table)
              .where(eq(table.producerKeychainId, producerKeychain.id)),
          ),
        );

        const {
          producerKeychainKeysSQL,
          producerKeychainSQL,
          producerKeychainUsersSQL,
        } = splitProducerKeychainIntoObjectsSQL(
          producerKeychain,
          metadataVersion,
        );

        await tx
          .insert(readmodelProducerKeychain)
          .values(producerKeychainSQL)
          .onConflictDoUpdate({
            set: producerKeychainSQL,
            target: [readmodelProducerKeychain.id],
          });

        if (producerKeychainUsersSQL.length > 0) {
          await tx
            .insert(readmodelProducerKeychainUser)
            .values(producerKeychainUsersSQL);
        }

        if (producerKeychainKeysSQL.length > 0) {
          await tx
            .insert(readmodelProducerKeychainKey)
            .values(producerKeychainKeysSQL);
        }

        await updateMetadataVersionInTables({
          db: tx,
          getIdColumn: (table) => table.producerKeychainId,
          id: producerKeychain.id,
          newMetadataVersion: metadataVersion,
          tables: [readmodelProducerKeychainEservice],
        });
      });
    },
    async upsertProducerKeychainEservice(
      producerKeychainEservice: ProducerKeychainEservice,
      metadataVersion: number,
    ): Promise<void> {
      return db.transaction(async (tx) => {
        const shouldUpsert = await checkMetadataVersion(
          tx,
          readmodelProducerKeychain,
          metadataVersion,
          producerKeychainEservice.producerKeychainId,
        );

        if (!shouldUpsert) {
          return;
        }

        await tx
          .delete(readmodelProducerKeychainEservice)
          .where(
            and(
              eq(
                readmodelProducerKeychainEservice.producerKeychainId,
                producerKeychainEservice.producerKeychainId,
              ),
              eq(
                readmodelProducerKeychainEservice.eserviceId,
                producerKeychainEservice.eserviceId,
              ),
            ),
          );

        await Promise.all([
          tx
            .insert(readmodelProducerKeychainEservice)
            .values(
              toProducerKeychainEserviceSQL(
                producerKeychainEservice,
                metadataVersion,
              ),
            ),
          updateMetadataVersionInTables({
            db: tx,
            getIdColumn: (table) => {
              if ("producerKeychainId" in table) {
                return table.producerKeychainId;
              }
              return table.id;
            },
            id: producerKeychainEservice.producerKeychainId,
            newMetadataVersion: metadataVersion,
            tables: producerKeychainTables,
          }),
        ]);
      });
    },
  };
}
