import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelConsumerKeychain,
  readmodelConsumerKeychainKey,
  readmodelConsumerKeychainPurpose,
  readmodelConsumerKeychainUser,
} from "@knodia/db-readmodel-keychain";
import { aggregateConsumerKeychains } from "@knodia/db-readmodel-keychain/converters";
import { eq } from "drizzle-orm";

export async function getAllConsumerKeychains(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      consumerKeychain: readmodelConsumerKeychain,
      key: readmodelConsumerKeychainKey,
      purpose: readmodelConsumerKeychainPurpose,
      user: readmodelConsumerKeychainUser,
    })
    .from(readmodelConsumerKeychain)
    .leftJoin(
      readmodelConsumerKeychainPurpose,
      eq(
        readmodelConsumerKeychain.id,
        readmodelConsumerKeychainPurpose.consumerKeychainId,
      ),
    )
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
