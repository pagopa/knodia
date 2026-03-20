import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  KnodeId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { and, eq } from "drizzle-orm";

import type {
  NewRemoteResourceAgreement,
  RemoteResourceAgreementSQL,
} from "../agreement.ts";
import type {
  NewRemoteResourcePurpose,
  RemoteResourcePurposeSQL,
} from "../purpose.ts";

import { remoteResourceAgreement } from "../agreement.ts";
import { remoteResourcePurpose } from "../purpose.ts";

export type RemoteResourceDbService = ReturnType<
  typeof remoteResourceDbServiceBuilder
>;

export function remoteResourceDbServiceBuilder(db: NodePgDatabase) {
  return {
    async getByAgreementId(
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
    async getByPurposeId(
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
