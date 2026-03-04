import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { Organization } from "@knodia/organization-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { unsafeBrandId } from "@knodia/common-models/ids";
import {
  createOrderByFilters,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import { eq, ilike } from "drizzle-orm";

import { readmodelOrganization } from "../organization.ts";

export function organizationReadmodelServiceBuilder(
  readmodelDb: NodePgDatabase,
) {
  return {
    async getOrganizations(params: {
      limit: number;
      offset: number;
      q?: string;
      sortBy: string;
      sortOrder: string;
    }): Promise<ListResult<Organization>> {
      const { limit, offset, q, sortBy, sortOrder } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy,
          sortOrder,
          table: readmodelOrganization,
        });

        const createFilterQuery = () => {
          const query = tx
            .select({ organizationId: readmodelOrganization.id })
            .from(readmodelOrganization)
            .where(q ? ilike(readmodelOrganization.name, `%${q}%`) : undefined)
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
              organization: readmodelOrganization,
            })
            .from(readmodelOrganization)
            .innerJoin(
              paginatedIds,
              eq(readmodelOrganization.id, paginatedIds.organizationId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        return {
          results: queryRes.map((row) => toOrganization(row.organization)),
          totalCount,
        };
      });
    },
  };
}

const toOrganization = (
  row: typeof readmodelOrganization.$inferSelect,
): Organization => ({
  createdAt: row.createdAt,
  id: unsafeBrandId(row.id),
  name: row.name,
});
