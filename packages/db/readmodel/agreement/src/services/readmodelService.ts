import type { Agreement } from "@knodia/agreement-models";
import type { AgreementId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import {
  readmodelAgreement,
  readmodelAgreementRequiredAttribute,
} from "../agreement.ts";
import { aggregateAgreement } from "../converters/aggregators.ts";

function agreementReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getAgreementById(
      agreementId: AgreementId,
    ): Promise<undefined | WithMetadata<Agreement>> {
      const queryRes = await readmodelDb
        .select({
          agreement: readmodelAgreement,
          requiredAttribute: readmodelAgreementRequiredAttribute,
        })
        .from(readmodelAgreement)
        .leftJoin(
          readmodelAgreementRequiredAttribute,
          eq(
            readmodelAgreementRequiredAttribute.agreementId,
            readmodelAgreement.id,
          ),
        )
        .where(eq(readmodelAgreement.id, agreementId));

      return aggregateAgreement(queryRes);
    },
  };
}

// TODO: knip workaround
console.log(
  "🚀 ~ agreementReadmodelServiceBuilder ~ agreementReadmodelServiceBuilder:",
  agreementReadmodelServiceBuilder,
);
