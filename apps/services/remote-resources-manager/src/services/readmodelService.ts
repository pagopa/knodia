import type { OrganizationId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { organizationReadmodelServiceBuilder } from "@knodia/db-readmodel-organization/services";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  const organizationReadmodelService =
    organizationReadmodelServiceBuilder(readmodelDb);

  return {
    async getOrganizationById(organizationId: OrganizationId) {
      return await organizationReadmodelService.getOrganizationById(
        organizationId,
      );
    },
  };
}
