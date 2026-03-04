import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelAgreement,
  readmodelAgreementAttribute,
} from "@knodia/db-readmodel-agreement";
import { aggregateAgreements } from "@knodia/db-readmodel-agreement/converters";
import { eq } from "drizzle-orm";

export async function getAllAgreements(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      agreement: readmodelAgreement,
      attribute: readmodelAgreementAttribute,
    })
    .from(readmodelAgreement)
    .leftJoin(
      readmodelAgreementAttribute,
      eq(readmodelAgreement.id, readmodelAgreementAttribute.agreementId),
    );

  return aggregateAgreements(queryRes);
}
