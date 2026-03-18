import type { ConsumerKeychainId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { checkMetadataVersion } from "@knodia/db-readmodel-commons/utils";
import { type ConsumerKeychain } from "@knodia/keychain-models";
import { and, eq, lte } from "drizzle-orm";

import {
  readmodelConsumerKeychain,
  readmodelConsumerKeychainKey,
  readmodelConsumerKeychainPurpose,
  readmodelConsumerKeychainUser,
} from "../consumerKeychain.ts";
import { splitConsumerKeychainIntoObjectsSQL } from "../converters/splitters.ts";

export type KeychainWriterService = ReturnType<typeof keychainWriterBuilder>;

export function keychainWriterBuilder(db: NodePgDatabase) {
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

        await tx
          .delete(readmodelConsumerKeychain)
          .where(eq(readmodelConsumerKeychain.id, consumerKeychain.id));

        const {
          consumerKeychainKeysSQL,
          consumerKeychainPurposesSQL,
          consumerKeychainSQL,
          consumerKeychainUsersSQL,
        } = splitConsumerKeychainIntoObjectsSQL(
          consumerKeychain,
          metadataVersion,
        );

        await tx.insert(readmodelConsumerKeychain).values(consumerKeychainSQL);

        if (consumerKeychainUsersSQL.length > 0) {
          await tx
            .insert(readmodelConsumerKeychainUser)
            .values(consumerKeychainUsersSQL);
        }

        if (consumerKeychainPurposesSQL.length > 0) {
          await tx
            .insert(readmodelConsumerKeychainPurpose)
            .values(consumerKeychainPurposesSQL);
        }

        if (consumerKeychainKeysSQL.length > 0) {
          await tx
            .insert(readmodelConsumerKeychainKey)
            .values(consumerKeychainKeysSQL);
        }
      });
    },
  };
}
