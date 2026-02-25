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

        if (keychainUsersSQL.length > 0) {
          await tx.insert(readmodelKeychainUser).values(keychainUsersSQL);
        }

        if (keychainPurposesSQL.length > 0) {
          await tx.insert(readmodelKeychainPurpose).values(keychainPurposesSQL);
        }

        if (keychainKeysSQL.length > 0) {
          await tx.insert(readmodelKeychainKey).values(keychainKeysSQL);
        }
      });
    },
  };
}
