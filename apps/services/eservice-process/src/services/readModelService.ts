import type { OrganizationId } from "@knodia/common-models/ids";
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
  readmodelEserviceInterface,
  readmodelEserviceVersion,
} from "@knodia/db-readmodel-eservice";
import {
  aggregateEservices,
  toEservicesAggregator,
} from "@knodia/db-readmodel-eservice/converters";
import { getLatestVersion } from "@knodia/eservice-models";
import { and, eq, ilike, or } from "drizzle-orm";

import type { API_GetProducerEservicesQueryParams } from "../models/api.ts";
import type { ProducerEservice } from "../models/types.ts";

export type ReadModelService = ReturnType<typeof readModelServiceBuilder>;

export function readModelServiceBuilder(readModelDb: NodePgDatabase) {
  return {
    async getProducerEservices(
      params: API_GetProducerEservicesQueryParams,
      producerId: OrganizationId,
    ): Promise<ListResult<ProducerEservice>> {
      const { limit, mode, offset, q, sortBy, sortOrder, status } = params;

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
              status ? eq(readmodelEserviceVersion.state, status) : undefined,
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
              interface: readmodelEserviceInterface,
              version: readmodelEserviceVersion,
            })
            .from(readmodelEservice)
            .innerJoin(subquery, eq(readmodelEservice.id, subquery.eserviceId))
            .innerJoin(
              readmodelEserviceVersion,
              eq(readmodelEservice.id, readmodelEserviceVersion.eserviceId),
            )
            .leftJoin(
              readmodelEserviceInterface,
              eq(
                readmodelEserviceVersion.id,
                readmodelEserviceInterface.eserviceVersionId,
              ),
            )
            .leftJoin(
              readmodelEserviceCategory,
              eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, readmodelEservice),
        ]);

        const eservices = aggregateEservices(toEservicesAggregator(queryRes));

        const results = eservices.map((e) => ({
          // TODO: fix. this is not producereservice
          ...e.data,
          // TODO: add real data
          activeAgreements: 0,
          activePurposes: 0,
          status: getLatestVersion(e.data).state,
        }));

        return { results, totalCount };
      });
    },
  };
}
