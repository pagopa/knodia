import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  EserviceVersionId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";

import { readmodelAgreement } from "@knodia/db-readmodel-agreement";
import { agreementReadmodelServiceBuilder } from "@knodia/db-readmodel-agreement/services";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { purposeReadmodelServiceBuilder } from "@knodia/db-readmodel-purpose/services";
import { and, eq } from "drizzle-orm";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const agreementReadmodelService =
    agreementReadmodelServiceBuilder(readmodelDb);
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  const purposeReadmodelService = purposeReadmodelServiceBuilder(readmodelDb);
  return {
    async getAgreement(
      consumer: ExternalResource<OrganizationId>,
      eserviceId: EserviceId,
    ) {
      return await agreementReadmodelService.getAgreementByFilter(
        and(
          eq(readmodelAgreement.consumerId, consumer.id),
          eq(readmodelAgreement.consumerKnodeId, consumer.knodeId),
          eq(readmodelAgreement.eserviceId, eserviceId),
        ),
      );
    },
    async getEserviceVersion(
      eserviceId: EserviceId,
      eserviceVersionId: EserviceVersionId,
    ) {
      return await eserviceReadmodelService.getEserviceVersionById(
        eserviceId,
        eserviceVersionId,
      );
    },
    async getPurpose(purposeId: PurposeId) {
      return await purposeReadmodelService.getPurposeById(purposeId);
    },
  };
}
