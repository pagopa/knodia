import type { ExternalId } from "@knodia/common-models/externalResource";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  type AgreementId,
  type EserviceId,
  KnodeId,
  type OrganizationId,
  type PurposeId,
} from "@knodia/common-models/ids";
import { and, eq } from "drizzle-orm";

import {
  type NewRemoteResourceAgreement,
  remoteResourceAgreement,
  type RemoteResourceAgreementSQL,
} from "../agreement.ts";
import {
  type NewRemoteResourcePurpose,
  remoteResourcePurpose,
  type RemoteResourcePurposeSQL,
} from "../purpose.ts";

export type RemoteResourceDbService = ReturnType<
  typeof remoteResourceDbServiceBuilder
>;

export function remoteResourceDbServiceBuilder(db: NodePgDatabase) {
  return {
    async getAgreementById(
      agreementId: ExternalId<AgreementId>,
      knodeId: KnodeId,
    ): Promise<RemoteResourceAgreementSQL | undefined> {
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
      return result;
    },
    async getAgreementsDistinctKnodes(consumerId: OrganizationId) {
      const queryResult = await db
        .selectDistinctOn([remoteResourceAgreement.knodeId])
        .from(remoteResourceAgreement)
        .where(eq(remoteResourceAgreement.consumerId, consumerId))
        .orderBy(remoteResourceAgreement.knodeId);

      return queryResult.map((r) => KnodeId.parse(r.knodeId));
    },
    async getPurposeById(
      purposeId: ExternalId<PurposeId>,
      knodeId: KnodeId,
    ): Promise<RemoteResourcePurposeSQL | undefined> {
      const [result] = await db
        .select()
        .from(remoteResourcePurpose)
        .where(
          and(
            eq(remoteResourcePurpose.purposeId, purposeId),
            eq(remoteResourcePurpose.knodeId, knodeId),
          ),
        )
        .limit(1);
      return result;
    },
    async getPurposesDistinctKnodes(
      consumerId: OrganizationId,
      // eserviceId narrows the lookup to that e-service's knode (single-target).
      eserviceId?: EserviceId,
    ) {
      const queryResult = await db
        .selectDistinctOn([remoteResourcePurpose.knodeId])
        .from(remoteResourcePurpose)
        .where(
          and(
            eq(remoteResourcePurpose.consumerId, consumerId),
            eserviceId
              ? eq(remoteResourcePurpose.eserviceId, eserviceId)
              : undefined,
          ),
        )
        .orderBy(remoteResourcePurpose.knodeId);

      return queryResult.map((r) => KnodeId.parse(r.knodeId));
    },
    async insertAgreement(
      remoteAgreement: NewRemoteResourceAgreement,
    ): Promise<void> {
      await db.insert(remoteResourceAgreement).values(remoteAgreement);
    },
    async insertPurpose(
      remotePurpose: NewRemoteResourcePurpose,
    ): Promise<void> {
      await db.insert(remoteResourcePurpose).values(remotePurpose);
    },
  };
}
