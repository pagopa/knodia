import type { Agreement, AgreementState } from "@knodia/agreement-models";
import type {
  EserviceId,
  EserviceVersionId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type { KnodeId, OrganizationId } from "@knodia/common-models/ids";
import type { ListResult, WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Eservice } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelAgreement,
  readmodelAgreementAttribute,
} from "@knodia/db-readmodel-agreement";
import { aggregateAgreements } from "@knodia/db-readmodel-agreement/converters";
import { getTableTotalCount } from "@knodia/db-readmodel-commons/utils";
import { readmodelEserviceVersion } from "@knodia/db-readmodel-eservice";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { purposeReadmodelServiceBuilder } from "@knodia/db-readmodel-purpose/services";
import { and, eq, inArray } from "drizzle-orm";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  const purposeReadmodelService = purposeReadmodelServiceBuilder(readmodelDb);
  return {
    async getAgreements({
      consumerId,
      consumerKnodeId,
      eserviceId,
      state,
    }: {
      consumerId: ExternalId<OrganizationId>;
      consumerKnodeId: KnodeId;
      eserviceId: EserviceId;
      state: AgreementState[];
    }): Promise<ListResult<Agreement>> {
      return await readmodelDb.transaction(async (tx) => {
        const createFilterQuery = () =>
          tx
            .select({
              agreementId: readmodelAgreement.id,
            })
            .from(readmodelAgreement)
            .where(
              and(
                eq(readmodelAgreement.eserviceId, eserviceId),
                eq(readmodelAgreement.consumerId, consumerId),
                eq(readmodelAgreement.consumerKnodeId, consumerKnodeId),
                state.length > 0
                  ? inArray(readmodelAgreement.state, state)
                  : undefined,
              ),
            )
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .limit(1)
          .offset(0)
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
            ),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const agreements = aggregateAgreements(queryRes);

        return {
          results: agreements.map((a) => a.data),
          totalCount,
        };
      });
    },
    async hasActiveEserviceVersion(
      eserviceId: EserviceId,
    ): Promise<boolean> {
      const result = await readmodelDb
        .select({ id: readmodelEserviceVersion.id })
        .from(readmodelEserviceVersion)
        .where(
          and(
            eq(readmodelEserviceVersion.eserviceId, eserviceId),
            eq(readmodelEserviceVersion.state, "Active"),
          ),
        )
        .limit(1);

      return result.length > 0;
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
    async getPurpose(purposeId: PurposeId) {
      return await purposeReadmodelService.getPurposeById(purposeId);
    },
  };
}
