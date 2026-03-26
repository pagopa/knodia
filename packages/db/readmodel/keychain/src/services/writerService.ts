import type { ConsumerKeychainId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  checkMetadataVersion,
  updateMetadataVersionInTables,
} from "@knodia/db-readmodel-commons/utils";
import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
} from "@knodia/keychain-models";
import { and, eq, lte } from "drizzle-orm";

import {
  consumerKeychainSubTables,
  consumerKeychainTables,
  readmodelConsumerKeychain,
  readmodelConsumerKeychainKey,
  readmodelConsumerKeychainPurpose,
  readmodelConsumerKeychainUser,
} from "../consumerKeychain.ts";
import {
  splitConsumerKeychainIntoObjectsSQL,
  toConsumerKeychainPurposeSQL,
} from "../converters/splitters.ts";

export type KeychainWriterService = ReturnType<
  typeof keychainWriterServiceBuilder
>;

export function keychainWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async deleteConsumerKeychain(
      consumerKeychainId: ConsumerKeychainId,
      metadataVersion: number,
    ): Promise<void> {
      await db
        .delete(readmodelConsumerKeychain)
        .where(
          and(
            eq(readmodelConsumerKeychain.id, consumerKeychainId),
            lte(readmodelConsumerKeychain.metadataVersion, metadataVersion),
          ),
        );
    },
    async upsertConsumerKeychain(
      consumerKeychain: ConsumerKeychain,
      metadataVersion: number,
    ): Promise<void> {
      return db.transaction(async (tx) => {
        const shouldUpsert = await checkMetadataVersion(
          tx,
          readmodelConsumerKeychain,
          metadataVersion,
          consumerKeychain.id,
        );

        if (!shouldUpsert) {
          return;
        }

        await Promise.all(
          consumerKeychainSubTables.map((table) =>
            tx
              .delete(table)
              .where(eq(table.consumerKeychainId, consumerKeychain.id)),
          ),
        );

        const {
          consumerKeychainKeysSQL,
          consumerKeychainSQL,
          consumerKeychainUsersSQL,
        } = splitConsumerKeychainIntoObjectsSQL(
          consumerKeychain,
          metadataVersion,
        );

        await tx
          .insert(readmodelConsumerKeychain)
          .values(consumerKeychainSQL)
          .onConflictDoUpdate({
            set: consumerKeychainSQL,
            target: [readmodelConsumerKeychain.id],
          });

        if (consumerKeychainUsersSQL.length > 0) {
          await tx
            .insert(readmodelConsumerKeychainUser)
            .values(consumerKeychainUsersSQL);
        }

        if (consumerKeychainKeysSQL.length > 0) {
          await tx
            .insert(readmodelConsumerKeychainKey)
            .values(consumerKeychainKeysSQL);
        }

        await updateMetadataVersionInTables({
          db: tx,
          getIdColumn: (table) => table.consumerKeychainId,
          id: consumerKeychain.id,
          newMetadataVersion: metadataVersion,
          tables: [readmodelConsumerKeychainPurpose],
        });
      });
    },
    async upsertConsumerKeychainPurpose(
      consumerKeychainPurpose: ConsumerKeychainPurpose,
      metadataVersion: number,
    ): Promise<void> {
      return db.transaction(async (tx) => {
        const shouldUpsert = await checkMetadataVersion(
          tx,
          readmodelConsumerKeychain,
          metadataVersion,
          consumerKeychainPurpose.consumerKeychainId,
        );

        if (!shouldUpsert) {
          return;
        }

        await tx
          .delete(readmodelConsumerKeychainPurpose)
          .where(
            and(
              eq(
                readmodelConsumerKeychainPurpose.consumerKeychainId,
                consumerKeychainPurpose.consumerKeychainId,
              ),
              eq(
                readmodelConsumerKeychainPurpose.purposeId,
                consumerKeychainPurpose.purposeId,
              ),
            ),
          );

        await Promise.all([
          tx
            .insert(readmodelConsumerKeychainPurpose)
            .values(
              toConsumerKeychainPurposeSQL(
                consumerKeychainPurpose,
                metadataVersion,
              ),
            ),
          updateMetadataVersionInTables({
            db: tx,
            getIdColumn: (table) => {
              if ("consumerKeychainId" in table) {
                return table.consumerKeychainId;
              }
              return table.id;
            },
            id: consumerKeychainPurpose.consumerKeychainId,
            newMetadataVersion: metadataVersion,
            tables: consumerKeychainTables.filter(
              (t) => t !== readmodelConsumerKeychainPurpose,
            ),
          }),
        ]);
      });
    },
  };
}
