import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  readmodelOrganization,
  readmodelOrganizationAttribute,
} from "@knodia/db-readmodel-organization";
import { aggregateOrganizations } from "@knodia/db-readmodel-organization/converters";
import { eq } from "drizzle-orm";

export async function getAllOrganizations(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      attribute: readmodelOrganizationAttribute,
      organization: readmodelOrganization,
    })
    .from(readmodelOrganization)
    .leftJoin(
      readmodelOrganizationAttribute,
      eq(
        readmodelOrganization.id,
        readmodelOrganizationAttribute.organizationId,
      ),
    );

  return aggregateOrganizations(queryRes);
}
