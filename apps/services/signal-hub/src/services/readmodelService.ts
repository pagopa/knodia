import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";

import { AgreementState } from "@knodia/agreement-models";
import { readmodelAgreement } from "@knodia/db-readmodel-agreement";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import { PurposeState } from "@knodia/purpose-models";
import { and, eq } from "drizzle-orm";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  return {
    async checkAgreementAndPurposeExistAndAreActive(
      organization: ExternalResource<OrganizationId>,
      eserviceId: EserviceId,
    ) {
      const queryRes = await readmodelDb
        .select({ agreementId: readmodelAgreement.id })
        .from(readmodelAgreement)
        .innerJoin(
          readmodelPurpose,
          and(
            eq(readmodelAgreement.consumerId, readmodelPurpose.consumerId),
            eq(
              readmodelAgreement.consumerKnodeId,
              readmodelPurpose.consumerKnodeId,
            ),
            eq(readmodelAgreement.eserviceId, readmodelPurpose.eserviceId),
          ),
        )
        .where(
          and(
            eq(readmodelAgreement.consumerId, organization.id),
            eq(readmodelAgreement.consumerKnodeId, organization.knodeId),
            eq(readmodelAgreement.eserviceId, eserviceId),
            eq(readmodelAgreement.state, AgreementState.enum.Active),
            eq(readmodelPurpose.state, PurposeState.enum.Active),
          ),
        )
        .limit(1);

      return queryRes.length > 0;
    },
    async getEserviceById(eserviceId: EserviceId) {
      return await eserviceReadmodelService.getEserviceById(eserviceId);
    },
  };
}
