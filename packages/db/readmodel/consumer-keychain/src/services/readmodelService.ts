import type { ConsumerKeychainId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type {
  ConsumerKeychain,
  FlatConsumerKeychain,
} from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import {
  readmodelConsumerKeychain,
  readmodelConsumerKeychainKey,
  readmodelConsumerKeychainPurpose,
  readmodelConsumerKeychainUser,
} from "../consumerKeychain.ts";
import {
  aggregateConsumerKeychain,
  aggregateFlatConsumerKeychain,
} from "../converters/aggregators.ts";

export function consumerKeychainReadmodelServiceBuilder(
  readmodelDb: NodePgDatabase,
) {
  return {
    async getConsumerKeychainById(
      consumerKeychainId: ConsumerKeychainId,
    ): Promise<undefined | WithMetadata<ConsumerKeychain>> {
      const queryRes = await readmodelDb
        .select({
          consumerKeychain: readmodelConsumerKeychain,
          key: readmodelConsumerKeychainKey,
          purpose: readmodelConsumerKeychainPurpose,
          user: readmodelConsumerKeychainUser,
        })
        .from(readmodelConsumerKeychain)
        .leftJoin(
          readmodelConsumerKeychainKey,
          eq(
            readmodelConsumerKeychainKey.consumerKeychainId,
            readmodelConsumerKeychain.id,
          ),
        )
        .leftJoin(
          readmodelConsumerKeychainPurpose,
          eq(
            readmodelConsumerKeychainPurpose.consumerKeychainId,
            readmodelConsumerKeychain.id,
          ),
        )
        .leftJoin(
          readmodelConsumerKeychainUser,
          eq(
            readmodelConsumerKeychainUser.consumerKeychainId,
            readmodelConsumerKeychain.id,
          ),
        )
        .where(eq(readmodelConsumerKeychain.id, consumerKeychainId));

      return aggregateConsumerKeychain(queryRes);
    },
    async getFlatConsumerKeychainById(
      consumerKeychainId: ConsumerKeychainId,
    ): Promise<undefined | WithMetadata<FlatConsumerKeychain>> {
      const queryRes = await readmodelDb
        .select({
          consumerKeychain: readmodelConsumerKeychain,
        })
        .from(readmodelConsumerKeychain)
        .where(eq(readmodelConsumerKeychain.id, consumerKeychainId));

      return aggregateFlatConsumerKeychain(queryRes);
    },
  };
}
