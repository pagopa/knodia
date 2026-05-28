import type { ProducerKeychainId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  checkMetadataVersion,
  updateMetadataVersionInTables,
} from "@knodia/db-readmodel-commons/utils";
import { type ProducerKeychain } from "@knodia/keychain-models";
import { and, eq, lte } from "drizzle-orm";

import { splitProducerKeychainIntoObjectsSQL } from "../converters/producerKeychainSplitters.ts";
import {
  producerKeychainSubTables,
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
  };
}
