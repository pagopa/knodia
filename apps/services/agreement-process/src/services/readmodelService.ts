import type { Agreement } from "@knodia/agreement-models";
import type { EserviceId, EserviceVersionId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelAgreement,
  readmodelAgreementAttribute,
} from "@knodia/db-readmodel-agreement";
import { aggregateAgreements } from "@knodia/db-readmodel-agreement/converters";
import {
  type ListResult,
  SortDirection,
  type WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import {
  createOrderByFilters,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import { readmodelEservice } from "@knodia/db-readmodel-eservice";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { type Eservice } from "@knodia/eservice-models";
import { and, eq, SQL } from "drizzle-orm";
import { toCamelCase } from "drizzle-orm/casing";

import type { API_GetAgreementsQueryParams } from "../models/api.ts";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  return {
    async getAgreements(
      requestQuery: API_GetAgreementsQueryParams,
    ): Promise<ListResult<Agreement>> {
      const {
        consumerId,
        consumerKnodeId,
        eserviceId,
        limit,
        offset,
        producerId,
        sortBy,
        sortOrder,
        state,
      } = requestQuery;

      return await readmodelDb.transaction(async (tx) => {
        const defaultSort: {
          sortBy: string;
          sortOrder: SortDirection;
        } = {
          sortBy: toCamelCase(readmodelAgreement.updatedAt.name),
          sortOrder: "desc",
        };

        const defaultOrderByFilters = createOrderByFilters({
          sortBy: defaultSort.sortBy,
          sortOrder:
            sortOrder && sortBy
              ? defaultSort.sortOrder
              : (sortOrder ?? defaultSort.sortOrder),
          table: readmodelAgreement,
        });
        let orderByFilters: SQL[] = [];
        if (sortBy) {
          if (sortBy === "eserviceName") {
            orderByFilters = createOrderByFilters({
              sortBy: readmodelEservice.name.name,
              sortOrder: sortOrder ?? SortDirection.enum.asc,
              table: readmodelEservice,
            }).concat(defaultOrderByFilters);
          } else {
            orderByFilters = createOrderByFilters({
              defaultSort,
              sortBy,
              sortOrder: sortOrder ?? SortDirection.enum.asc,
              table: readmodelAgreement,
            });
          }
        } else {
          orderByFilters = defaultOrderByFilters;
        }

        const createFilterQuery = () =>
          tx
            .select({
              agreementId: readmodelAgreement.id,
            })
            .from(readmodelAgreement)
            .innerJoin(
              readmodelEservice,
              eq(readmodelAgreement.eserviceId, readmodelEservice.id),
            )
            .where(
              and(
                eserviceId ? eq(readmodelEservice.id, eserviceId) : undefined,
                consumerId
                  ? eq(readmodelAgreement.consumerId, consumerId)
                  : undefined,
                consumerKnodeId
                  ? eq(readmodelAgreement.consumerKnodeId, consumerKnodeId)
                  : undefined,
                state ? eq(readmodelAgreement.state, state) : undefined,
                producerId
                  ? eq(readmodelAgreement.producerId, producerId)
                  : undefined,
              ),
            )
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .orderBy(...orderByFilters)
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              agreement: readmodelAgreement,
              attribute: readmodelAgreementAttribute,
            })
            .from(readmodelAgreement)
            .innerJoin(
              paginatedIds,
              eq(readmodelAgreement.id, paginatedIds.agreementId),
            )
            .leftJoin(
              readmodelAgreementAttribute,
              eq(
                readmodelAgreement.id,
                readmodelAgreementAttribute.agreementId,
              ),
            )
            .innerJoin(
              readmodelEservice,
              eq(readmodelAgreement.eserviceId, readmodelEservice.id),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const agreements = aggregateAgreements(queryRes);

        return {
          results: agreements.map((e) => e.data),
          totalCount,
        };
      });
    },
    async getEservice(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<Eservice>> {
      return await eserviceReadmodelService.getEServiceById(eserviceId);
    },
    async getEserviceVersion(
      eserviceId: EserviceId,
      eserviceVersionId: EserviceVersionId,
    ) {
      return await eserviceReadmodelService.getEServiceVersionById(
        eserviceId,
        eserviceVersionId,
      );
    },
  };
}
