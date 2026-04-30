import type {
  ConsumerKeychainId,
  KnodiaApiKeychainId,
} from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
  FlatKnodiaApiKeychain,
  KnodiaApiKeychain,
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
} from "../converters/aggregators.ts";
import { toConsumerKeychainPurpose } from "../converters/converters.ts";
import {
  aggregateFlatKnodiaApiKeychain,
  aggregateKnodiaApiKeychain,
} from "../converters/knodiaApiKeychainAggregators.ts";
import {
  readmodelKnodiaApiKeychain,
  readmodelKnodiaApiKeychainKey,
  readmodelKnodiaApiKeychainUser,
} from "../knodiaApiKeychain.ts";

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
    async getFlatKnodiaApiKeychainById(
      knodiaApiKeychainId: KnodiaApiKeychainId,
    ): Promise<undefined | WithMetadata<FlatKnodiaApiKeychain>> {
      const queryRes = await readmodelDb
        .select({
          knodiaApiKeychain: readmodelKnodiaApiKeychain,
        })
        .from(readmodelKnodiaApiKeychain)
        .where(eq(readmodelKnodiaApiKeychain.id, knodiaApiKeychainId));

      return aggregateFlatKnodiaApiKeychain(queryRes);
    },
    async getKnodiaApiKeychainById(
      knodiaApiKeychainId: KnodiaApiKeychainId,
    ): Promise<undefined | WithMetadata<KnodiaApiKeychain>> {
      const queryRes = await readmodelDb
        .select({
          key: readmodelKnodiaApiKeychainKey,
          knodiaApiKeychain: readmodelKnodiaApiKeychain,
          user: readmodelKnodiaApiKeychainUser,
        })
        .from(readmodelKnodiaApiKeychain)
        .leftJoin(
          readmodelKnodiaApiKeychainKey,
          eq(
            readmodelKnodiaApiKeychainKey.knodiaApiKeychainId,
            readmodelKnodiaApiKeychain.id,
          ),
        )
        .leftJoin(
          readmodelKnodiaApiKeychainUser,
          eq(
            readmodelKnodiaApiKeychainUser.knodiaApiKeychainId,
            readmodelKnodiaApiKeychain.id,
          ),
        )
        .where(eq(readmodelKnodiaApiKeychain.id, knodiaApiKeychainId));

      return aggregateKnodiaApiKeychain(queryRes);
    },
  };
}
