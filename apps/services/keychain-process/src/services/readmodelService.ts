import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { ConsumerKeychainId, PurposeId } from "@knodia/common-models/ids";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type {
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
} from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createOrderByFilters,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import {
  readmodelConsumerKeychain,
  readmodelConsumerKeychainPurpose,
} from "@knodia/db-readmodel-keychain";
import {
  aggregateFlatConsumerKeychains,
  toConsumerKeychainPurpose,
} from "@knodia/db-readmodel-keychain/converters";
import { consumerKeychainReadmodelServiceBuilder } from "@knodia/db-readmodel-keychain/services";
import { and, eq } from "drizzle-orm";

import type {
  API_GetConsumerKeychainPurposesQueryParams,
  API_GetConsumerKeychainsQueryParams,
} from "../models/api.ts";

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
    async getConsumerKeychainPurpose(
      consumerKeychainId: ConsumerKeychainId,
      purpose: ExternalResource<PurposeId>,
    ) {
      return await consumerKeychainReadmodelService.getConsumerKeychainPurposeByFilter(
        and(
          eq(
            readmodelConsumerKeychainPurpose.consumerKeychainId,
            consumerKeychainId,
          ),
          eq(readmodelConsumerKeychainPurpose.purposeId, purpose.id),
          eq(readmodelConsumerKeychainPurpose.producerKnodeId, purpose.knodeId),
        ),
      );
    },
    async getConsumerKeychainPurposes(
      consumerKeychainId: ConsumerKeychainId,
      params: API_GetConsumerKeychainPurposesQueryParams,
    ): Promise<ListResult<ConsumerKeychainPurpose>> {
      const { limit, offset } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "linkedAt",
          sortOrder: "desc",
          table: readmodelConsumerKeychainPurpose,
        });

        const createFilterQuery = () =>
          tx
            .select()
            .from(readmodelConsumerKeychainPurpose)
            .where(
              eq(
                readmodelConsumerKeychainPurpose.consumerKeychainId,
                consumerKeychainId,
              ),
            )
            .$dynamic();

        const [queryRes, totalCount] = await Promise.all([
          createFilterQuery()
            .orderBy(...orderByFilters)
            .limit(limit)
            .offset(offset),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const consumerKeychainPurposes = queryRes.map(
          toConsumerKeychainPurpose,
        );

        return {
          results: consumerKeychainPurposes.map((e) => e.data),
          totalCount,
        };
      });
    },
    async getConsumerKeychains(
      params: API_GetConsumerKeychainsQueryParams,
    ): Promise<ListResult<FlatConsumerKeychain>> {
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
          .orderBy(...orderByFilters)
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

        const keychains = aggregateFlatConsumerKeychains(queryRes);

        return {
          results: keychains.map((e) => e.data),
          totalCount,
        };
      });
    },
  };
}
