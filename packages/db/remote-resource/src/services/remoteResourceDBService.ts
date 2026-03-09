import type { ExternalId } from "@knodia/common-models/externalResource";
import type { AgreementId, KnodeId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { and, eq } from "drizzle-orm";

import type { NewAgreementSQL } from "../agreement.ts";

import { agreement } from "../agreement.ts";

export type RemoteResourceDbService = ReturnType<
  typeof remoteResourceDbServiceBuilder
>;

export function remoteResourceDbServiceBuilder(db: NodePgDatabase) {
  return {
    async getByAgreementId(
      agreementId: ExternalId<AgreementId>,
      knodeId: KnodeId,
    ) {
      const [result] = await db
        .select()
        .from(agreement)
        .where(
          and(
            eq(agreement.agreementId, agreementId),
            eq(agreement.knodeId, knodeId),
          ),
        )
        .limit(1);
      return result ?? undefined;
    },
    async upsertAgreement(remoteAgreement: NewAgreementSQL): Promise<void> {
      await db
        .insert(agreement)
        .values(remoteAgreement)
        .onConflictDoUpdate({
          set: {
            consumerId: remoteAgreement.consumerId,
            eserviceId: remoteAgreement.eserviceId,
            eserviceVersionId: remoteAgreement.eserviceVersionId,
            knodeId: remoteAgreement.knodeId,
            producerId: remoteAgreement.producerId,
          },
          target: agreement.agreementId,
        });
    },
  };
}
