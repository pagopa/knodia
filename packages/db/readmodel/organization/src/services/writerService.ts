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
        const shouldUpsert = await checkMetadataVersion({
          id: organization.id,
          metadataVersion,
          table: readmodelOrganization,
          tableIdColumn: readmodelOrganization.id,
          tx,
        });

        if (!shouldUpsert) {
          return;
        }

        await tx
          .delete(readmodelOrganization)
          .where(eq(readmodelOrganization.id, organization.id));

        await tx.insert(readmodelOrganization).values(organizationSQL);

        if (attributesSQL.length > 0) {
          await tx.insert(readmodelOrganizationAttribute).values(attributesSQL);
        }
      });
    },
  };
}
