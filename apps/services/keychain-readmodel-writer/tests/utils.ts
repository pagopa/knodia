import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelConsumerKeychain,
  readmodelConsumerKeychainKey,
  readmodelConsumerKeychainUser,
} from "@knodia/db-readmodel-keychain";
import { aggregateConsumerKeychains } from "@knodia/db-readmodel-keychain/converters";
import { eq } from "drizzle-orm";

export async function getAllConsumerKeychains(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      consumerKeychain: readmodelConsumerKeychain,
      key: readmodelConsumerKeychainKey,
      user: readmodelConsumerKeychainUser,
    })
    .from(readmodelConsumerKeychain)
    .leftJoin(
      readmodelConsumerKeychainUser,
      eq(
        readmodelConsumerKeychain.id,
        readmodelConsumerKeychainUser.consumerKeychainId,
      ),
    )
    .leftJoin(
      readmodelConsumerKeychainKey,
      eq(
        readmodelConsumerKeychain.id,
        readmodelConsumerKeychainKey.consumerKeychainId,
      ),
    );

  return aggregateConsumerKeychains(queryRes);
}
