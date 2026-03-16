import type { ExternalId } from "@knodia/common-models/externalResource";
import type { EserviceId, KnodeId, OrganizationId, PurposeId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { readmodelAgreement } from "@knodia/db-readmodel-agreement";
import { readmodelEserviceVersion } from "@knodia/db-readmodel-eservice";
import { purposeReadmodelServiceBuilder } from "@knodia/db-readmodel-purpose/services";
import { and, eq } from "drizzle-orm";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const purposeReadmodelService = purposeReadmodelServiceBuilder(readmodelDb);
  return {
    async getActiveAgreement({
      consumerId,
      consumerKnodeId,
      eserviceId,
    }: {
      consumerId: ExternalId<OrganizationId>;
      consumerKnodeId: KnodeId;
      eserviceId: EserviceId;
    }) {
      const [first] = await readmodelDb
        .select({ id: readmodelAgreement.id })
        .from(readmodelAgreement)
        .where(
          and(
            eq(readmodelAgreement.eserviceId, eserviceId),
            eq(readmodelAgreement.consumerId, consumerId),
            eq(readmodelAgreement.consumerKnodeId, consumerKnodeId),
            eq(readmodelAgreement.state, "Active"),
          ),
        )
        .limit(1);

      return first;
    },
    async getActiveEserviceVersion(eserviceId: EserviceId) {
      const [first] = await readmodelDb
        .select({ id: readmodelEserviceVersion.id })
        .from(readmodelEserviceVersion)
        .where(
          and(
            eq(readmodelEserviceVersion.eserviceId, eserviceId),
            eq(readmodelEserviceVersion.state, "Active"),
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
