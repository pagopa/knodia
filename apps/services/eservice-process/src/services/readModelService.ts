import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createOrderByFilters,
  escapeRegExp,
  getTableTotalCount,
  ilikeJsonB,
  type ListResult,
} from "@knodia/db-readmodel-commons";
import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceVersion,
} from "@knodia/db-readmodel-eservice";
import {
  aggregateEservices,
  toEservicesAggregator,
} from "@knodia/db-readmodel-eservice/converters";
import { Eservice } from "@knodia/eservice-models";
import { and, eq, ilike, inArray, or } from "drizzle-orm";

import type { API_GetEservicesQueryParams } from "../models/api.ts";

export type ReadModelService = ReturnType<typeof readModelServiceBuilder>;

export function readModelServiceBuilder(readModelDb: NodePgDatabase) {
  return {
    async getEservices(
      params: API_GetEservicesQueryParams,
    ): Promise<ListResult<Eservice>> {
      const { limit, mode, offset, producerId, q, sortBy, sortOrder, status } =
        params;

      return await readModelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy,
          sortOrder,
          table: readmodelEservice,
        });

        const subquery = tx
          .select({
            eserviceId: readmodelEservice.id,
          })
          .from(readmodelEservice)
          .leftJoin(
            readmodelEserviceCategory,
            eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
          )
          .innerJoin(
            readmodelEserviceVersion,
            eq(readmodelEservice.id, readmodelEserviceVersion.eserviceId),
          )
          .where(
            and(
              producerId
                ? eq(readmodelEservice.producerId, producerId)
                : undefined,
              mode ? eq(readmodelEservice.mode, mode) : undefined,
              status && status.length > 0
                ? inArray(readmodelEserviceVersion.state, status)
                : undefined,
              q
                ? or(
                    ilikeJsonB(readmodelEservice.name, q),
                    ilikeJsonB(readmodelEservice.description, q),
                    ilike(
                      // TODO: filter by category name instead of code when using real data
                      readmodelEserviceCategory.code,
                      `%${escapeRegExp(q)}%`,
                    ),
                  )
                : undefined,
            ),
          )
          .groupBy(readmodelEservice.id)
          .orderBy(...orderByFilters)
          .limit(limit)
          .offset(offset)
          .as("subquery");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              category: readmodelEserviceCategory,
              eservice: readmodelEservice,
            })
            .from(readmodelEservice)
            .innerJoin(subquery, eq(readmodelEservice.id, subquery.eserviceId))
            .leftJoin(
              readmodelEserviceCategory,
              eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, readmodelEservice),
        ]);

        const eservices = aggregateEservices(toEservicesAggregator(queryRes));

        const results = eservices.map((e) => ({
          ...e.data,
          // TODO: add real data, also update the return type
          activeAgreements: 0,
          activePurposes: 0,
        }));

        return { results, totalCount };
      });
    },
  };
}
