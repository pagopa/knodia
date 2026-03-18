import type { Agreement } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Eservice } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelAgreement,
  readmodelAgreementAttribute,
} from "@knodia/db-readmodel-agreement";
import { aggregateAgreements } from "@knodia/db-readmodel-agreement/converters";
import { eserviceReadmodelServiceBuilder } from "@knodia/db-readmodel-eservice/services";
import { purposeReadmodelServiceBuilder } from "@knodia/db-readmodel-purpose/services";
import { and, eq } from "drizzle-orm";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const eserviceReadmodelService = eserviceReadmodelServiceBuilder(readmodelDb);
  const purposeReadmodelService = purposeReadmodelServiceBuilder(readmodelDb);
  return {
    async getAgreementsByConsumerAndEservice({
      consumerId,
      consumerKnodeId,
      eserviceId,
    }: {
      consumerId: ExternalId<OrganizationId>;
      consumerKnodeId: KnodeId;
      eserviceId: EserviceId;
    }): Promise<Agreement[]> {
      const queryRes = await readmodelDb
        .select({
          agreement: readmodelAgreement,
          attribute: readmodelAgreementAttribute,
        })
        .from(readmodelAgreement)
        .leftJoin(
          readmodelAgreementAttribute,
          eq(readmodelAgreementAttribute.agreementId, readmodelAgreement.id),
        )
        .where(
          and(
            eq(readmodelAgreement.eserviceId, eserviceId),
            eq(readmodelAgreement.consumerId, consumerId),
            eq(readmodelAgreement.consumerKnodeId, consumerKnodeId),
          ),
        );

      return aggregateAgreements(queryRes).map((a) => a.data);
    },
    async getEservice(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<Eservice>> {
      return await eserviceReadmodelService.getEServiceById(eserviceId);
    },
    async getPurpose(purposeId: PurposeId) {
      return await purposeReadmodelService.getPurposeById(purposeId);
    },
  };
}
