import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { Tenant } from "@knodia/tenant-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { unsafeBrandId } from "@knodia/common-models/ids";
import {
  createOrderByFilters,
  getTableTotalCount,
} from "@knodia/db-readmodel-commons/utils";
import { eq, ilike } from "drizzle-orm";

import { readmodelTenant } from "../tenant.ts";

export function tenantReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getTenants(params: {
      limit: number;
      offset: number;
      q?: string;
      sortBy: string;
      sortOrder: string;
    }): Promise<ListResult<Tenant>> {
      const { limit, offset, q, sortBy, sortOrder } = params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy,
          sortOrder,
          table: readmodelTenant,
        });

        const createFilterQuery = () => {
          const query = tx
            .select({ tenantId: readmodelTenant.id })
            .from(readmodelTenant)
            .where(q ? ilike(readmodelTenant.name, `%${q}%`) : undefined)
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
              tenant: readmodelTenant,
            })
            .from(readmodelTenant)
            .innerJoin(
              paginatedIds,
              eq(readmodelTenant.id, paginatedIds.tenantId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        return {
          results: queryRes.map((row) => toTenant(row.tenant)),
          totalCount,
        };
      });
    },
  };
}

const toTenant = (row: typeof readmodelTenant.$inferSelect): Tenant => ({
  createdAt: row.createdAt,
  id: unsafeBrandId(row.id),
  name: row.name,
});
