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
  type WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import {
  createOrderByFilters,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import { readmodelEservice } from "@knodia/db-readmodel-eservice";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { type Eservice } from "@knodia/eservice-models";
import { eq } from "drizzle-orm";

import type { API_GetAgreementsQueryParams } from "../models/api.ts";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  return {
    async getAgreements(
      requestQuery: API_GetAgreementsQueryParams,
    ): Promise<ListResult<Agreement>> {
      const { limit, offset } = requestQuery;

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
            .innerJoin(
              readmodelEservice,
              eq(readmodelAgreement.eserviceId, readmodelEservice.id),
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
          results: agreements.map((a) => a.data),
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
