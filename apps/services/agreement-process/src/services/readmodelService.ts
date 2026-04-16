import type { Agreement } from "@knodia/agreement-models";
import type { AgreementId, EserviceId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelAgreement,
  readmodelAgreementAttribute,
} from "@knodia/db-readmodel-agreement";
import { aggregateAgreements } from "@knodia/db-readmodel-agreement/converters";
import { agreementReadmodelServiceBuilder } from "@knodia/db-readmodel-agreement/services";
import {
  type ListResult,
  type WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import {
  createOrderByFilters,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { type Eservice } from "@knodia/eservice-models";
import { and, eq, gte, inArray } from "drizzle-orm";

import type { API_GetAgreementsQueryParams } from "../models/api.ts";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const agreementReadmodelService =
    agreementReadmodelServiceBuilder(readmodelDb);
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  return {
    async getAgreement(agreementId: AgreementId) {
      return await agreementReadmodelService.getAgreementById(agreementId);
    },
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
        state,
        updatedSince,
      } = requestQuery;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "updatedAt",
          sortOrder: "desc",
          table: readmodelAgreement,
        });

        const createFilterQuery = () =>
          tx
            .select({
              agreementId: readmodelAgreement.id,
            })
            .from(readmodelAgreement)
            .where(
              and(
                producerId
                  ? eq(readmodelAgreement.producerId, producerId)
                  : undefined,
                eserviceId
                  ? eq(readmodelAgreement.eserviceId, eserviceId)
                  : undefined,
                consumerId
                  ? eq(readmodelAgreement.consumerId, consumerId)
                  : undefined,
                consumerKnodeId
                  ? eq(readmodelAgreement.consumerKnodeId, consumerKnodeId)
                  : undefined,
                state && state.length > 0
                  ? inArray(readmodelAgreement.state, state)
                  : undefined,
                updatedSince
                  ? gte(readmodelAgreement.updatedAt, new Date(updatedSince))
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
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const agreements = aggregateAgreements(queryRes);

        return {
          results: agreements.map((a) => a.data),
          totalCount,
        };
      });
    },
    async getEservice(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<Eservice>> {
      return await eserviceReadmodelService.getEserviceById(eserviceId);
    },
  };
}
