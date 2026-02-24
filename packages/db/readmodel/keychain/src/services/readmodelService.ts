import type { KeychainId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Keychain } from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import { aggregateKeychain } from "../converters/aggregators.ts";
import {
  readmodelKeychain,
  readmodelKeychainKey,
  readmodelKeychainPurpose,
  readmodelKeychainUser,
} from "../keychain.ts";

export function keychainReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getKeychainById(
      keychainId: KeychainId,
    ): Promise<undefined | WithMetadata<Keychain>> {
      const queryRes = await readmodelDb
        .select({
          key: readmodelKeychainKey,
          keychain: readmodelKeychain,
          purpose: readmodelKeychainPurpose,
          user: readmodelKeychainUser,
        })
        .from(readmodelKeychain)
        .leftJoin(
          readmodelKeychainKey,
          eq(readmodelKeychainKey.keychainId, readmodelKeychain.id),
        )
        .leftJoin(
          readmodelKeychainPurpose,
          eq(readmodelKeychainPurpose.keychainId, readmodelKeychain.id),
        )
        .leftJoin(
          readmodelKeychainUser,
          eq(readmodelKeychainUser.keychainId, readmodelKeychain.id),
        )
        .where(eq(readmodelKeychain.id, keychainId));

      return aggregateKeychain(queryRes);
    },
  };
}
