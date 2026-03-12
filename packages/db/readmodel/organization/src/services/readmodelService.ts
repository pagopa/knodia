import type { OrganizationId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Organization } from "@knodia/organization-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq, ilike } from "drizzle-orm";

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
      organizationId: OrganizationId,
    ): Promise<undefined | WithMetadata<Organization>> {
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
    async getOrganizationByName(
      name: string,
    ): Promise<undefined | WithMetadata<Organization>> {
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
        .where(ilike(readmodelOrganization.name, name));

      return aggregateOrganization(queryRes);
    },
  };
}
