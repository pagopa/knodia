import type { KnodeApiKeychainId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type {
  FlatKnodeApiKeychain,
  KnodeApiKeychain,
} from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import {
  aggregateFlatKnodeApiKeychain,
  aggregateKnodeApiKeychain,
} from "../converters/knodeApiKeychainAggregators.ts";
import {
  readmodelKnodeApiKeychain,
  readmodelKnodeApiKeychainKey,
  readmodelKnodeApiKeychainUser,
} from "../knodeApiKeychain.ts";

/** @knipignore */
export function knodeApiKeychainReadmodelServiceBuilder(
  readmodelDb: NodePgDatabase,
) {
  return {
    async getFlatKnodeApiKeychainById(
      knodeApiKeychainId: KnodeApiKeychainId,
    ): Promise<undefined | WithMetadata<FlatKnodeApiKeychain>> {
      const queryRes = await readmodelDb
        .select({
          knodeApiKeychain: readmodelKnodeApiKeychain,
        })
        .from(readmodelKnodeApiKeychain)
        .where(eq(readmodelKnodeApiKeychain.id, knodeApiKeychainId));

      return aggregateFlatKnodeApiKeychain(queryRes);
    },
    async getKnodeApiKeychainById(
      knodeApiKeychainId: KnodeApiKeychainId,
    ): Promise<undefined | WithMetadata<KnodeApiKeychain>> {
      const queryRes = await readmodelDb
        .select({
          key: readmodelKnodeApiKeychainKey,
          knodeApiKeychain: readmodelKnodeApiKeychain,
          user: readmodelKnodeApiKeychainUser,
        })
        .from(readmodelKnodeApiKeychain)
        .leftJoin(
          readmodelKnodeApiKeychainKey,
          eq(
            readmodelKnodeApiKeychainKey.knodeApiKeychainId,
            readmodelKnodeApiKeychain.id,
          ),
        )
        .leftJoin(
          readmodelKnodeApiKeychainUser,
          eq(
            readmodelKnodeApiKeychainUser.knodeApiKeychainId,
            readmodelKnodeApiKeychain.id,
          ),
        )
        .where(eq(readmodelKnodeApiKeychain.id, knodeApiKeychainId));

      return aggregateKnodeApiKeychain(queryRes);
    },
  };
}
