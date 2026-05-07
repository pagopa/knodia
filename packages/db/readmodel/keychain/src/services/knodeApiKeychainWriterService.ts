import type { KnodeApiKeychainId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { checkMetadataVersion } from "@knodia/db-readmodel-commons/utils";
import { type KnodeApiKeychain } from "@knodia/keychain-models";
import { and, eq, lte } from "drizzle-orm";

import { splitKnodeApiKeychainIntoObjectsSQL } from "../converters/knodeApiKeychainSplitters.ts";
import {
  knodeApiKeychainSubTables,
  readmodelKnodeApiKeychain,
  readmodelKnodeApiKeychainKey,
  readmodelKnodeApiKeychainUser,
} from "../knodeApiKeychain.ts";

/** @knipignore */
export function knodeApiKeychainWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async deleteKnodeApiKeychain(
      knodeApiKeychainId: KnodeApiKeychainId,
      metadataVersion: number,
    ): Promise<void> {
      await db
        .delete(readmodelKnodeApiKeychain)
        .where(
          and(
            eq(readmodelKnodeApiKeychain.id, knodeApiKeychainId),
            lte(readmodelKnodeApiKeychain.metadataVersion, metadataVersion),
          ),
        );
    },
    async upsertKnodeApiKeychain(
      knodeApiKeychain: KnodeApiKeychain,
      metadataVersion: number,
    ): Promise<void> {
      return db.transaction((tx) =>
        upsertKnodeApiKeychainTx(tx, knodeApiKeychain, metadataVersion),
      );
    },
  };
}

async function upsertKnodeApiKeychainTx(
  tx: Parameters<Parameters<NodePgDatabase["transaction"]>[0]>[0],
  knodeApiKeychain: KnodeApiKeychain,
  metadataVersion: number,
): Promise<void> {
  const shouldUpsert = await checkMetadataVersion(
    tx,
    readmodelKnodeApiKeychain,
    metadataVersion,
    knodeApiKeychain.id,
  );

  if (!shouldUpsert) {
    return;
  }

  await Promise.all(
    knodeApiKeychainSubTables.map((table) =>
      tx.delete(table).where(eq(table.knodeApiKeychainId, knodeApiKeychain.id)),
    ),
  );

  const {
    knodeApiKeychainKeysSQL,
    knodeApiKeychainSQL,
    knodeApiKeychainUsersSQL,
  } = splitKnodeApiKeychainIntoObjectsSQL(knodeApiKeychain, metadataVersion);

  await tx
    .insert(readmodelKnodeApiKeychain)
    .values(knodeApiKeychainSQL)
    .onConflictDoUpdate({
      set: knodeApiKeychainSQL,
      target: [readmodelKnodeApiKeychain.id],
    });

  if (knodeApiKeychainUsersSQL.length > 0) {
    await tx
      .insert(readmodelKnodeApiKeychainUser)
      .values(knodeApiKeychainUsersSQL);
  }

  if (knodeApiKeychainKeysSQL.length > 0) {
    await tx
      .insert(readmodelKnodeApiKeychainKey)
      .values(knodeApiKeychainKeysSQL);
  }
}
