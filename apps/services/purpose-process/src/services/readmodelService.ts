import type { Agreement } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type { Eservice } from "@knodia/eservice-models";
import type { Purpose } from "@knodia/purpose-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelAgreement,
  readmodelAgreementAttribute,
} from "@knodia/db-readmodel-agreement";
import { aggregateAgreements } from "@knodia/db-readmodel-agreement/converters";
import {
  createOrderByFilters,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import { readmodelEservice } from "@knodia/db-readmodel-eservice";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import { aggregatePurposes } from "@knodia/db-readmodel-purpose/converters";
import { purposeReadmodelServiceBuilder } from "@knodia/db-readmodel-purpose/services";
import { and, eq, inArray } from "drizzle-orm";

import type { API_GetPurposesQueryParams } from "../models/api.ts";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  const purposeReadmodelService = purposeReadmodelServiceBuilder(readmodelDb);
  return {
    async getAgreementsByConsumerAndEservice({
      consumerId,
      consumerKnodeId,
      eserviceId,
    }: {
      consumerId: ExternalId<OrganizationId>;
      consumerKnodeId: KnodeId;
      eserviceId: EserviceId;
    }): Promise<Agreement[]> {
      const queryRes = await readmodelDb
        .select({
          agreement: readmodelAgreement,
          attribute: readmodelAgreementAttribute,
        })
        .from(readmodelAgreement)
        .leftJoin(
          readmodelAgreementAttribute,
          eq(readmodelAgreementAttribute.agreementId, readmodelAgreement.id),
        )
        .where(
          and(
            eq(readmodelAgreement.eserviceId, eserviceId),
            eq(readmodelAgreement.consumerId, consumerId),
            eq(readmodelAgreement.consumerKnodeId, consumerKnodeId),
          ),
        );

      return aggregateAgreements(queryRes).map((a) => a.data);
    },
    async getEservice(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<Eservice>> {
      return await eserviceReadmodelService.getEserviceById(eserviceId);
    },
    async getPurpose(purposeId: PurposeId) {
      return await purposeReadmodelService.getPurposeById(purposeId);
    },
    async getPurposes(
      requestQuery: API_GetPurposesQueryParams,
    ): Promise<ListResult<Purpose>> {
      const { agreementId, eserviceId, limit, offset, producerId, state } =
        requestQuery;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "updatedAt",
          sortOrder: "desc",
          table: readmodelPurpose,
        });

        const createFilterQuery = () => {
          let query = tx
            .select({ purposeId: readmodelPurpose.id })
            .from(readmodelPurpose)
            .$dynamic();

          if (producerId) {
            query = query.leftJoin(
              readmodelEservice,
              eq(readmodelPurpose.eserviceId, readmodelEservice.id),
            );
          }

          if (agreementId) {
            query = query.leftJoin(
              readmodelAgreement,
              and(
                eq(readmodelPurpose.eserviceId, readmodelAgreement.eserviceId),
                eq(readmodelPurpose.consumerId, readmodelAgreement.consumerId),
                eq(
                  readmodelPurpose.consumerKnodeId,
                  readmodelAgreement.consumerKnodeId,
                ),
              ),
            );
          }

          return query.where(
            and(
              eserviceId
                ? eq(readmodelPurpose.eserviceId, eserviceId)
                : undefined,
              state && state.length > 0
                ? inArray(readmodelPurpose.state, state)
                : undefined,
              producerId
                ? eq(readmodelEservice.producerId, producerId)
                : undefined,
              agreementId ? eq(readmodelAgreement.id, agreementId) : undefined,
            ),
          );
        };

        const paginatedIds = createFilterQuery()
          .orderBy(...orderByFilters)
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({ purpose: readmodelPurpose })
            .from(readmodelPurpose)
            .innerJoin(
              paginatedIds,
              eq(readmodelPurpose.id, paginatedIds.purposeId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const purposes = aggregatePurposes(queryRes);

        return {
          results: purposes.map((p) => p.data),
          totalCount,
        };
      });
    },
  };
}
