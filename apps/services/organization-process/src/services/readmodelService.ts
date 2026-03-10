import type { OrganizationId } from "@knodia/common-models/ids";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { Organization } from "@knodia/organization-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createOrderByFilters,
  escapeRegExp,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import {
  readmodelOrganization,
  readmodelOrganizationAttribute,
} from "@knodia/db-readmodel-organization";
import { aggregateOrganizations } from "@knodia/db-readmodel-organization/converters";
import { organizationReadmodelServiceBuilder } from "@knodia/db-readmodel-organization/services";
import { eq, ilike } from "drizzle-orm";

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
    async getOrganizations(params: {
      limit: number;
      offset: number;
      q?: string;
    }): Promise<ListResult<Organization>> {
      const { limit, offset, q } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy: "name",
          sortOrder: "asc",
          table: readmodelOrganization,
        });

        const createFilterQuery = () => {
          const query = tx
            .select({ organizationId: readmodelOrganization.id })
            .from(readmodelOrganization)
            .where(
              q
                ? ilike(readmodelOrganization.name, `%${escapeRegExp(q)}%`)
                : undefined,
            )
            .$dynamic();

          return query;
        };

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
