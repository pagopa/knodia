import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { getTableTotalCount } from "@knodia/db-readmodel-commons/utils";
import { and, eq } from "drizzle-orm";

import type {
  NewRemoteResourceAgreement,
  RemoteResourceAgreementSQL,
} from "../agreement.ts";

import { remoteResourceAgreement } from "../agreement.ts";

export type RemoteResourceDbService = ReturnType<
  typeof remoteResourceDbServiceBuilder
>;

export function remoteResourceDbServiceBuilder(db: NodePgDatabase) {
  return {
    async getAgreementById(
      agreementId: ExternalId<AgreementId>,
      knodeId: KnodeId,
    ) {
      const [result] = await db
        .select()
        .from(remoteResourceAgreement)
        .where(
          and(
            eq(remoteResourceAgreement.agreementId, agreementId),
            eq(remoteResourceAgreement.knodeId, knodeId),
          ),
        )
        .limit(1);
      return result ?? undefined;
    },
    async getAgreementsByConsumerId({
      consumerId,
      limit,
      offset,
    }: {
      consumerId: OrganizationId;
      limit: number;
      offset: number;
    }): Promise<{
      results: RemoteResourceAgreementSQL[];
      totalCount: number;
    }> {
      return await db.transaction(async (tx) => {
        const orderByFilter = remoteResourceAgreement.agreementId;

        const createFilterQuery = () =>
          tx
            .select({
              agreementId: remoteResourceAgreement.agreementId,
            })
            .from(remoteResourceAgreement)
            .where(eq(remoteResourceAgreement.consumerId, consumerId))
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .orderBy(orderByFilter)
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [remoteAgreements, totalCount] = await Promise.all([
          tx
            .select()
            .from(remoteResourceAgreement)
            .innerJoin(
              paginatedIds,
              eq(remoteResourceAgreement.agreementId, paginatedIds.agreementId),
            )
            .orderBy(orderByFilter),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        return {
          results: remoteAgreements.map(({ agreement }) => agreement),
          totalCount,
        };
      });
    },
    async insertAgreement(
      remoteAgreement: NewRemoteResourceAgreement,
    ): Promise<void> {
      await db.insert(remoteResourceAgreement).values(remoteAgreement);
    },
  };
}
