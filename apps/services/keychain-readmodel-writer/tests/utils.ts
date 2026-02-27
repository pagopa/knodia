import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelKeychain,
  readmodelKeychainKey,
  readmodelKeychainPurpose,
  readmodelKeychainUser,
} from "@knodia/db-readmodel-keychain";
import { aggregateKeychains } from "@knodia/db-readmodel-keychain/converters";
import { eq } from "drizzle-orm";

export async function getAllKeychains(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      key: readmodelKeychainKey,
      keychain: readmodelKeychain,
      purpose: readmodelKeychainPurpose,
      user: readmodelKeychainUser,
    })
    .from(readmodelKeychain)
    .leftJoin(
      readmodelKeychainPurpose,
      eq(readmodelKeychain.id, readmodelKeychainPurpose.keychainId),
    )
    .leftJoin(
      readmodelKeychainUser,
      eq(readmodelKeychain.id, readmodelKeychainUser.keychainId),
    )
    .leftJoin(
      readmodelKeychainKey,
      eq(readmodelKeychain.id, readmodelKeychainKey.keychainId),
    );

  return aggregateKeychains(queryRes);
}
