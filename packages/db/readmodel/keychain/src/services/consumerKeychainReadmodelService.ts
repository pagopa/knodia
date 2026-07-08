import type { ConsumerKeychainId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
} from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  assertSQLFiltersAreDefined,
  getTablePKString,
  throwIfMultiple,
} from "@knodia/db-readmodel-commons/utils";
import { eq, type SQL } from "drizzle-orm";

import {
  readmodelConsumerKeychain,
  readmodelConsumerKeychainKey,
  readmodelConsumerKeychainPurpose,
  readmodelConsumerKeychainUser,
} from "../consumerKeychain.ts";
import {
  aggregateConsumerKeychain,
  aggregateFlatConsumerKeychain,
} from "../converters/consumerKeychainAggregators.ts";
import { toConsumerKeychainPurpose } from "../converters/consumerKeychainConverters.ts";
import {
  keychainWithNameExists,
  type KeychainWithNameExistsQuery,
} from "./keychainNameQuery.ts";

export function consumerKeychainReadmodelServiceBuilder(
  readmodelDb: NodePgDatabase,
) {
  return {
    async consumerKeychainWithNameExists(
      query: KeychainWithNameExistsQuery,
    ): Promise<boolean> {
      return await keychainWithNameExists(
        readmodelDb,
        readmodelConsumerKeychain,
        query,
      );
    },
    async getConsumerKeychainById(
      consumerKeychainId: ConsumerKeychainId,
    ): Promise<undefined | WithMetadata<ConsumerKeychain>> {
      const queryRes = await readmodelDb
        .select({
          consumerKeychain: readmodelConsumerKeychain,
          key: readmodelConsumerKeychainKey,
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
          readmodelConsumerKeychainUser,
          eq(
            readmodelConsumerKeychainUser.consumerKeychainId,
            readmodelConsumerKeychain.id,
          ),
        )
        .where(eq(readmodelConsumerKeychain.id, consumerKeychainId));

      return aggregateConsumerKeychain(queryRes);
    },
    async getConsumerKeychainPurposeByFilter(
      filters: SQL | undefined,
    ): Promise<undefined | WithMetadata<ConsumerKeychainPurpose>> {
      assertSQLFiltersAreDefined(filters);

      const queryRes = await readmodelDb
        .select()
        .from(readmodelConsumerKeychainPurpose)
        .where(filters);

      const consumerKeychainPurpose = throwIfMultiple(
        queryRes,
        "consumer keychain purpose",
        (ckp) => getTablePKString(ckp, readmodelConsumerKeychainPurpose),
      );

      return consumerKeychainPurpose
        ? toConsumerKeychainPurpose(consumerKeychainPurpose)
        : undefined;
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
