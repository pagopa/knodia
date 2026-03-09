import type { Organization } from "@knodia/organization-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import { aggregateOrganization } from "../converters/index.ts";
import {
  readmodelOrganization,
  readmodelOrganizationAttribute,
} from "../organization.ts";

export function organizationReadmodelServiceBuilder(
  readmodelDb: NodePgDatabase,
) {
  return {
    async getOrganizationById(
      organizationId: string,
    ): Promise<Organization | undefined> {
      const queryRes = await readmodelDb
        .select({
          attribute: readmodelOrganizationAttribute,
          organization: readmodelOrganization,
        })
        .from(readmodelOrganization)
        .leftJoin(
          readmodelOrganizationAttribute,
          eq(
            readmodelOrganizationAttribute.organizationId,
            readmodelOrganization.id,
          ),
        )
        .where(eq(readmodelOrganization.id, organizationId));

      return aggregateOrganization(queryRes);
    },
  };
}
