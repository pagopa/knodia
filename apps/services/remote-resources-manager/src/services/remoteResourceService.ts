import type { AgreementId, KnodeId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { and, eq } from "drizzle-orm";

import type { RemoteAgreement } from "../models/agreement.ts";

import { remoteResourceAgreement } from "../db/schema.ts";

export type RemoteResourceService = ReturnType<
  typeof remoteResourceServiceBuilder
>;

export function remoteResourceServiceBuilder(db: NodePgDatabase) {
  return {
    async getByAgreementId(agreementId: AgreementId, knodeId: KnodeId) {
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
    async upsertAgreement(agreement: RemoteAgreement): Promise<void> {
      await db
        .delete(remoteResourceAgreement)
        .where(eq(remoteResourceAgreement.id, agreement.id));

      await db.insert(remoteResourceAgreement).values({
        agreementId: agreement.agreementId,
        id: agreement.id,
        knodeId: agreement.knodeId,
        updatedAt: agreement.updatedAt,
      });
    },
  };
}
