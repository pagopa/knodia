import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { LocalizedPurposeName, Purpose } from "@knodia/purpose-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { ilikeJsonBExact } from "@knodia/db-readmodel-commons/utils";
import { and, eq } from "drizzle-orm";

import { aggregatePurpose } from "../converters/aggregators.ts";
import { readmodelPurpose } from "../purpose.ts";

export function purposeReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getPurposeById(
      purposeId: PurposeId,
    ): Promise<undefined | WithMetadata<Purpose>> {
      const queryRes = await readmodelDb
        .select({
          purpose: readmodelPurpose,
        })
        .from(readmodelPurpose)
        .where(eq(readmodelPurpose.id, purposeId));

      return aggregatePurpose(queryRes);
    },
    // Returns a bare existence flag instead of the aggregated purpose because
    // the name match may hit multiple rows (duplicates created before the
    // uniqueness check existed), which the aggregator would reject.
    async purposeWithNameExists({
      consumerId,
      consumerKnodeId,
      eserviceId,
      name,
    }: {
      consumerId: ExternalId<OrganizationId>;
      consumerKnodeId: KnodeId;
      eserviceId: EserviceId;
      name: LocalizedPurposeName;
    }): Promise<boolean> {
      const queryRes = await readmodelDb
        .select({ id: readmodelPurpose.id })
        .from(readmodelPurpose)
        .where(
          and(
            eq(readmodelPurpose.eserviceId, eserviceId),
            eq(readmodelPurpose.consumerId, consumerId),
            eq(readmodelPurpose.consumerKnodeId, consumerKnodeId),
            ilikeJsonBExact({ column: readmodelPurpose.name, value: name.en }),
          ),
        )
        .limit(1);

      return queryRes.length > 0;
    },
  };
}
