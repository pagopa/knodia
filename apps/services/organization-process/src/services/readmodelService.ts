import type { OrganizationId } from "@knodia/common-models/ids";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { Organization } from "@knodia/organization-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createOrderByFilters,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import {
  readmodelOrganization,
  readmodelOrganizationAttribute,
} from "@knodia/db-readmodel-organization";
import { aggregateOrganizations } from "@knodia/db-readmodel-organization/converters";
import { organizationReadmodelServiceBuilder } from "@knodia/db-readmodel-organization/services";
import { eq, inArray } from "drizzle-orm";

import type { API_GetOrganizationsQueryParams } from "../models/api.ts";

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
    async getOrganizationByName(name: string) {
      return await organizationReadmodelService.getOrganizationByName(name);
    },
    async getOrganizations(
      params: API_GetOrganizationsQueryParams,
    ): Promise<ListResult<Organization>> {
      const { limit, offset, organizationId } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "name",
          sortOrder: "asc",
          table: readmodelOrganization,
        });

        const createFilterQuery = () =>
          tx
            .select({ organizationId: readmodelOrganization.id })
            .from(readmodelOrganization)
            .where(
              organizationId && organizationId.length > 0
                ? inArray(readmodelOrganization.id, organizationId)
                : undefined,
            )
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .orderBy(...orderByFilters)
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              attribute: readmodelOrganizationAttribute,
              organization: readmodelOrganization,
            })
            .from(readmodelOrganization)
            .innerJoin(
              paginatedIds,
              eq(readmodelOrganization.id, paginatedIds.organizationId),
            )
            .leftJoin(
              readmodelOrganizationAttribute,
              eq(
                readmodelOrganizationAttribute.organizationId,
                readmodelOrganization.id,
              ),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        return {
          results: aggregateOrganizations(queryRes).map((o) => o.data),
          totalCount,
        };
      });
    },
  };
}
