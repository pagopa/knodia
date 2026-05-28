import type { ProducerKeychainId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { FlatProducerKeychain } from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import { aggregateFlatProducerKeychain } from "../converters/producerKeychainAggregators.ts";
import { readmodelProducerKeychain } from "../producerKeychain.ts";

export function producerKeychainReadmodelServiceBuilder(
  readmodelDb: NodePgDatabase,
) {
  return {
    async getFlatProducerKeychainById(
      producerKeychainId: ProducerKeychainId,
    ): Promise<undefined | WithMetadata<FlatProducerKeychain>> {
      const queryRes = await readmodelDb
        .select({
          producerKeychain: readmodelProducerKeychain,
        })
        .from(readmodelProducerKeychain)
        .where(eq(readmodelProducerKeychain.id, producerKeychainId));

      return aggregateFlatProducerKeychain(queryRes);
    },
  };
}
