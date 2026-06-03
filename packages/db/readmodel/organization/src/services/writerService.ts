import type { Organization } from "@knodia/organization-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { checkMetadataVersion } from "@knodia/db-readmodel-commons/utils";
import { eq } from "drizzle-orm";

import { splitOrganizationIntoObjectsSQL } from "../converters/splitters.ts";
import {
  readmodelOrganization,
  readmodelOrganizationAttribute,
} from "../organization.ts";

export type OrganizationWriterService = ReturnType<
  typeof organizationWriterServiceBuilder
>;

export function organizationWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async upsertOrganization(
      organization: Organization,
      metadataVersion: number,
    ): Promise<void> {
      const { attributesSQL, organizationSQL } =
        splitOrganizationIntoObjectsSQL(organization, metadataVersion);

      await db.transaction(async (tx) => {
        const shouldUpsert = await checkMetadataVersion(
          tx,
          readmodelOrganization,
          metadataVersion,
          organization.id,
        );

        if (!shouldUpsert) {
          return;
        }

        await tx
          .delete(readmodelOrganization)
          .where(eq(readmodelOrganization.id, organization.id));

        const inserted = await tx
          .insert(readmodelOrganization)
          .values(organizationSQL)
          .onConflictDoNothing({
            target: readmodelOrganization.externalRequestId,
          })
          .returning({ id: readmodelOrganization.id });

        // A different organization already owns this externalRequestId (a
        // duplicate created in the createOrganization pre-check race window):
        // drop the duplicate projection so the readmodel keeps one organization
        // per key instead of failing the unique index and poisoning the consumer.
        if (inserted.length === 0) {
          return;
        }

        if (attributesSQL.length > 0) {
          await tx.insert(readmodelOrganizationAttribute).values(attributesSQL);
        }
      });
    },
  };
}
