import type { ConsumerKeychainId, PurposeId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
} from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  getTablePKString,
  throwIfMultiple,
} from "@knodia/db-readmodel-commons/utils";
import { and, eq } from "drizzle-orm";

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

export type ConsumerKeychainReadmodelService = ReturnType<
  typeof consumerKeychainReadmodelServiceBuilder
>;

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
    async getConsumerKeychainPurposeByKeychainId(
      consumerKeychainId: ConsumerKeychainId,
      purposeId: PurposeId,
    ): Promise<undefined | WithMetadata<ConsumerKeychainPurpose>> {
      const queryRes = await readmodelDb
        .select()
        .from(readmodelConsumerKeychainPurpose)
        .where(
          and(
            eq(
              readmodelConsumerKeychainPurpose.consumerKeychainId,
              consumerKeychainId,
            ),
            eq(readmodelConsumerKeychainPurpose.purposeId, purposeId),
          ),
        );

      const consumerKeychainPurpose = throwIfMultiple(
        queryRes,
        "consumer keychain purpose",
        (ckp) => getTablePKString(ckp, readmodelConsumerKeychainPurpose),
      );

      return consumerKeychainPurpose
        ? toConsumerKeychainPurpose(consumerKeychainPurpose)
        : undefined;
    },
    async getConsumerKeychainPurposesByKeychainId(
      consumerKeychainId: ConsumerKeychainId,
    ): Promise<WithMetadata<ConsumerKeychainPurpose>[]> {
      const queryRes = await readmodelDb
        .select()
        .from(readmodelConsumerKeychainPurpose)
        .where(
          eq(
            readmodelConsumerKeychainPurpose.consumerKeychainId,
            consumerKeychainId,
          ),
        );

      return queryRes.map(toConsumerKeychainPurpose);
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
