import type { ExternalId } from "@knodia/common-models/externalResource";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  type AgreementId,
  KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { and, eq } from "drizzle-orm";

import {
  type NewRemoteResourceAgreement,
  remoteResourceAgreement,
} from "../agreement.ts";

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
    async getAgreementsDistinctKnodes(consumerId: OrganizationId) {
      const queryResult = await db
        .selectDistinctOn([remoteResourceAgreement.knodeId])
        .from(remoteResourceAgreement)
        .where(eq(remoteResourceAgreement.consumerId, consumerId))
        .orderBy(remoteResourceAgreement.knodeId);

      return queryResult.map((r) => KnodeId.parse(r.knodeId));
    },
    async insertAgreement(
      remoteAgreement: NewRemoteResourceAgreement,
    ): Promise<void> {
      await db.insert(remoteResourceAgreement).values(remoteAgreement);
    },
  };
}
