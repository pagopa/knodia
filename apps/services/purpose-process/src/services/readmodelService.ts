import type { AgreementState } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { EserviceVersionState } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { readmodelAgreement } from "@knodia/db-readmodel-agreement";
import { readmodelEserviceVersion } from "@knodia/db-readmodel-eservice";
import { purposeReadmodelServiceBuilder } from "@knodia/db-readmodel-purpose/services";
import { and, eq, inArray } from "drizzle-orm";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const purposeReadmodelService = purposeReadmodelServiceBuilder(readmodelDb);
  return {
    async getAgreementByStates({
      consumerId,
      consumerKnodeId,
      eserviceId,
      states,
    }: {
      consumerId: ExternalId<OrganizationId>;
      consumerKnodeId: KnodeId;
      eserviceId: EserviceId;
      states: AgreementState[];
    }) {
      const [first] = await readmodelDb
        .select({ id: readmodelAgreement.id })
        .from(readmodelAgreement)
        .where(
          and(
            eq(readmodelAgreement.eserviceId, eserviceId),
            eq(readmodelAgreement.consumerId, consumerId),
            eq(readmodelAgreement.consumerKnodeId, consumerKnodeId),
            inArray(readmodelAgreement.state, states),
          ),
        )
        .limit(1);

      return first;
    },
    async getEserviceVersionByStates({
      eserviceId,
      states,
    }: {
      eserviceId: EserviceId;
      states: EserviceVersionState[];
    }) {
      const [first] = await readmodelDb
        .select({ id: readmodelEserviceVersion.id })
        .from(readmodelEserviceVersion)
        .where(
          and(
            eq(readmodelEserviceVersion.eserviceId, eserviceId),
            inArray(readmodelEserviceVersion.state, states),
          ),
        )
        .limit(1);

      return first;
    },
    async getPurpose(purposeId: PurposeId) {
      return await purposeReadmodelService.getPurposeById(purposeId);
    },
  };
}
