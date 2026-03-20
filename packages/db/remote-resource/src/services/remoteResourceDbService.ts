import type { ExternalId } from "@knodia/common-models/externalResource";
import type { AgreementId, KnodeId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  assertSQLFiltersAreDefined,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";
import { and, eq, SQL } from "drizzle-orm";

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
    async getAgreementByFilters(
      filters: SQL | undefined,
    ): Promise<RemoteResourceAgreementSQL> {
      assertSQLFiltersAreDefined(filters);

      const queryResult = await db
        .select()
        .from(remoteResourceAgreement)
        .where(filters);

      const remoteAgreement = throwIfMultipleOrEmpty(
        queryResult,
        "remote resource agreement",
        (r) => r.agreementId,
      );

      return remoteAgreement;
    },
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
    async getDistinctKnodes() {
      const queryResult = await db
        .selectDistinctOn([remoteResourceAgreement.knodeId])
        .from(remoteResourceAgreement)
        .orderBy(remoteResourceAgreement.knodeId);
      return queryResult.map((r) => r.knodeId);
    },
    async insertAgreement(
      remoteAgreement: NewRemoteResourceAgreement,
    ): Promise<void> {
      await db.insert(remoteResourceAgreement).values(remoteAgreement);
    },
  };
}
