import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { checkMetadataVersion } from "@knodia/db-readmodel-commons/utils";
import { type Keychain } from "@knodia/keychain-models";
import { eq } from "drizzle-orm";

import { splitKeychainIntoObjectsSQL } from "../converters/splitters.ts";
import {
  readmodelKeychain,
  readmodelKeychainKey,
  readmodelKeychainPurpose,
  readmodelKeychainUser,
} from "../keychain.ts";

export type KeychainWriterService = ReturnType<
  typeof keychainWriterServiceBuilder
>;

export function keychainWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async upsertKeychain(
      keychain: Keychain,
      metadataVersion: number,
    ): Promise<void> {
      return db.transaction(async (tx) => {
        const shouldUpsert = await checkMetadataVersion(
          tx,
          readmodelKeychain,
          metadataVersion,
          keychain.id,
        );

        if (!shouldUpsert) {
          return;
        }

        await tx
          .delete(readmodelKeychain)
          .where(eq(readmodelKeychain.id, keychain.id));

        const {
          keychainKeysSQL,
          keychainPurposesSQL,
          keychainSQL,
          keychainUsersSQL,
        } = splitKeychainIntoObjectsSQL(keychain, metadataVersion);

        await tx.insert(readmodelKeychain).values(keychainSQL);

        for (const userSQL of keychainUsersSQL) {
          await tx
            .insert(readmodelKeychainUser)
            .values(userSQL)
            .onConflictDoNothing();
        }

        for (const purposeSQL of keychainPurposesSQL) {
          await tx.insert(readmodelKeychainPurpose).values(purposeSQL);
        }

        for (const keySQL of keychainKeysSQL) {
          await tx.insert(readmodelKeychainKey).values(keySQL);
        }
      });
    },
  };
}
