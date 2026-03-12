import type { ConsumerKeychainId } from "@knodia/common-models/ids";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { ConsumerKeychain } from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createOrderByFilters,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import { readmodelConsumerKeychain } from "@knodia/db-readmodel-consumer-keychain";
import { aggregateConsumerKeychains } from "@knodia/db-readmodel-consumer-keychain/converters";
import { consumerKeychainReadmodelServiceBuilder } from "@knodia/db-readmodel-consumer-keychain/services";
import { eq } from "drizzle-orm";

import type { API_GetConsumerKeychainsQueryParams } from "../models/api.ts";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const consumerKeychainReadmodelService =
    consumerKeychainReadmodelServiceBuilder(readmodelDb);

  return {
    async getConsumerKeychainById(consumerKeychainId: ConsumerKeychainId) {
      return await consumerKeychainReadmodelService.getConsumerKeychainById(
        consumerKeychainId,
      );
    },
    async getConsumerKeychains(
      params: API_GetConsumerKeychainsQueryParams,
    ): Promise<ListResult<ConsumerKeychain>> {
      const { limit, offset } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "updatedAt",
          sortOrder: "desc",
          table: readmodelConsumerKeychain,
        });

        const createFilterQuery = () =>
          tx
            .select({ keychainId: readmodelConsumerKeychain.id })
            .from(readmodelConsumerKeychain)
            .groupBy(readmodelConsumerKeychain.id)
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              consumerKeychain: readmodelConsumerKeychain,
            })
            .from(readmodelConsumerKeychain)
            .innerJoin(
              paginatedIds,
              eq(readmodelConsumerKeychain.id, paginatedIds.keychainId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const keychains = aggregateConsumerKeychains(queryRes);

        return {
          results: keychains.map((e) => e.data),
          totalCount,
        };
      });
    },
  };
}
