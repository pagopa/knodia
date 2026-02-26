import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createOrderByFilters,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import { readmodelKeychain } from "@knodia/db-readmodel-keychain";
import { aggregateKeychains } from "@knodia/db-readmodel-keychain/converters";
import { type Keychain } from "@knodia/keychain-models";
import { eq } from "drizzle-orm";

import type { API_GetKeychainsQueryParams } from "../models/api.ts";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getKeychains(
      params: API_GetKeychainsQueryParams,
    ): Promise<ListResult<Keychain>> {
      const { limit, offset } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "createdAt",
          sortOrder: "asc",
          table: readmodelKeychain,
        });

        const createFilterQuery = () =>
          tx
            .select({ keychainId: readmodelKeychain.id })
            .from(readmodelKeychain)
            .groupBy(readmodelKeychain.id)
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              keychain: readmodelKeychain,
            })
            .from(readmodelKeychain)
            .innerJoin(
              paginatedIds,
              eq(readmodelKeychain.id, paginatedIds.keychainId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const keychains = aggregateKeychains(queryRes);

        return {
          results: keychains.map((e) => e.data),
          totalCount,
        };
      });
    },
  };
}
