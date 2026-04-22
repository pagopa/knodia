import type { Agreement } from "@knodia/agreement-models";
import type { AgreementId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  assertSQLFiltersAreDefined,
  createOrderByFilters,
} from "@knodia/db-readmodel-commons/utils";
import { eq, type SQL } from "drizzle-orm";

import {
  readmodelAgreement,
  readmodelAgreementAttribute,
} from "../agreement.ts";
import { aggregateAgreement } from "../converters/aggregators.ts";

export function agreementReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getAgreementByFilter(
      filters: SQL | undefined,
    ): Promise<undefined | WithMetadata<Agreement>> {
      assertSQLFiltersAreDefined(filters);

      const orderByFilters = createOrderByFilters({
        sortBy: "updatedAt",
        sortOrder: "desc",
        table: readmodelAgreement,
      });

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
        .where(filters)
        .orderBy(...orderByFilters)
        .limit(1);

      return aggregateAgreement(queryRes);
    },
    async getAgreementById(
      agreementId: AgreementId,
    ): Promise<undefined | WithMetadata<Agreement>> {
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
        .where(eq(readmodelAgreement.id, agreementId));

      return aggregateAgreement(queryRes);
    },
  };
}
