import type { ConsumerKeychainId } from "@knodia/common-models/ids";
import type { ConsumerKeychain } from "@knodia/consumer-keychain-models";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import { readmodelConsumerKeychain } from "../consumerKeychain.ts";
import { aggregateConsumerKeychain } from "../converters/aggregators.ts";

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
        })
        .from(readmodelConsumerKeychain)
        .where(eq(readmodelConsumerKeychain.id, consumerKeychainId));

      return aggregateConsumerKeychain(queryRes);
    },
  };
}
