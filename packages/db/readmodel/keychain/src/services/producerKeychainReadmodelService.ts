import type { KeyId, ProducerKeychainId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type {
  FlatProducerKeychain,
  KeychainKey,
  ProducerKeychain,
  ProducerKeychainEservice,
} from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  assertSQLFiltersAreDefined,
  getTablePKString,
  throwIfMultiple,
} from "@knodia/db-readmodel-commons/utils";
import { eq, type SQL } from "drizzle-orm";

import { toKeychainKey } from "../converters/keychainConverters.ts";
import {
  aggregateFlatProducerKeychain,
  aggregateProducerKeychain,
} from "../converters/producerKeychainAggregators.ts";
import { toProducerKeychainEservice } from "../converters/producerKeychainConverters.ts";
import {
  readmodelProducerKeychain,
  readmodelProducerKeychainEservice,
  readmodelProducerKeychainKey,
  readmodelProducerKeychainUser,
} from "../producerKeychain.ts";
import {
  keychainWithNameExists,
  type KeychainWithNameExistsQuery,
} from "./keychainNameQuery.ts";

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
    async getProducerKeyByKid(kid: KeyId): Promise<KeychainKey | undefined> {
      const queryRes = await readmodelDb
        .select()
        .from(readmodelProducerKeychainKey)
        .where(eq(readmodelProducerKeychainKey.kid, kid));

      const producerKey = throwIfMultiple(
        queryRes,
        "producer keychain key",
        (pk) => getTablePKString(pk, readmodelProducerKeychainKey),
      );

      return producerKey ? toKeychainKey(producerKey) : undefined;
    },
    async getProducerKeychainById(
      producerKeychainId: ProducerKeychainId,
    ): Promise<undefined | WithMetadata<ProducerKeychain>> {
      const queryRes = await readmodelDb
        .select({
          key: readmodelProducerKeychainKey,
          producerKeychain: readmodelProducerKeychain,
          user: readmodelProducerKeychainUser,
        })
        .from(readmodelProducerKeychain)
        .leftJoin(
          readmodelProducerKeychainKey,
          eq(
            readmodelProducerKeychainKey.producerKeychainId,
            readmodelProducerKeychain.id,
          ),
        )
        .leftJoin(
          readmodelProducerKeychainUser,
          eq(
            readmodelProducerKeychainUser.producerKeychainId,
            readmodelProducerKeychain.id,
          ),
        )
        .where(eq(readmodelProducerKeychain.id, producerKeychainId));

      return aggregateProducerKeychain(queryRes);
    },
    async getProducerKeychainEserviceByFilter(
      filters: SQL | undefined,
    ): Promise<undefined | WithMetadata<ProducerKeychainEservice>> {
      assertSQLFiltersAreDefined(filters);

      const queryRes = await readmodelDb
        .select()
        .from(readmodelProducerKeychainEservice)
        .where(filters);

      const producerKeychainEservice = throwIfMultiple(
        queryRes,
        "producer keychain eservice",
        (pke) => getTablePKString(pke, readmodelProducerKeychainEservice),
      );

      return producerKeychainEservice
        ? toProducerKeychainEservice(producerKeychainEservice)
        : undefined;
    },
    async producerKeychainWithNameExists(
      query: KeychainWithNameExistsQuery,
    ): Promise<boolean> {
      return await keychainWithNameExists(
        readmodelDb,
        readmodelProducerKeychain,
        query,
      );
    },
  };
}
