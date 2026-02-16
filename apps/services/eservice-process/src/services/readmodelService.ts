import type { EserviceId } from "@knodia/common-models/ids";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type { EserviceReadmodelService } from "@knodia/db-readmodel-eservice/services";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createOrderByFilters,
  escapeRegExp,
  getTableTotalCount,
  ilikeJsonB,
} from "@knodia/db-readmodel-commons/utils";
import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "@knodia/db-readmodel-eservice";
import {
  aggregateEservices,
  aggregateEserviceVersion,
} from "@knodia/db-readmodel-eservice/converters";
import { type Eservice } from "@knodia/eservice-models";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import type { API_GetEservicesQueryParams } from "../models/api.ts";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(
  readmodelDb: NodePgDatabase,
  eserviceReadmodelService: EserviceReadmodelService,
) {
  return {
    async getEservice(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<Eservice>> {
      return await eserviceReadmodelService.getEServiceById(eserviceId);
    },
    async getEserviceLatestVersion(eserviceId: EserviceId) {
      return await readmodelDb.transaction(async (tx) => {
        const subquery = tx
          .select({
            id: readmodelEserviceVersion.id,
          })
          .from(readmodelEserviceVersion)
          .where(eq(readmodelEserviceVersion.eserviceId, eserviceId))
          .orderBy(desc(readmodelEserviceVersion.versionNumber))
          .limit(1)
          .as("latestVersion");

        const queryRes = await tx
          .select({
            requiredAttribute: readmodelEserviceVersionRequiredAttribute,
            version: readmodelEserviceVersion,
          })
          .from(readmodelEserviceVersion)
          .innerJoin(subquery, eq(readmodelEserviceVersion.id, subquery.id))
          .leftJoin(
            readmodelEserviceVersionRequiredAttribute,
            eq(
              readmodelEserviceVersionRequiredAttribute.eserviceVersionId,
              readmodelEserviceVersion.id,
            ),
          )
          .where(eq(readmodelEserviceVersion.eserviceId, eserviceId))
          .orderBy(desc(readmodelEserviceVersion.versionNumber));

        return aggregateEserviceVersion(queryRes);
      });
    },
    async getEservices(
      params: API_GetEservicesQueryParams,
    ): Promise<ListResult<Eservice>> {
      const { limit, mode, offset, producerId, q, sortBy, sortOrder, state } =
        params;

      return await readmodelDb.transaction(async (tx) => {
        const orderByFilters = createOrderByFilters({
          sortBy,
          sortOrder,
          table: readmodelEservice,
        });

        const latestEserviceVersion = tx
          .select({
            state: readmodelEserviceVersion.state,
            versionNumber: readmodelEserviceVersion.versionNumber,
          })
          .from(readmodelEserviceVersion)
          .where(eq(readmodelEserviceVersion.eserviceId, readmodelEservice.id))
          .orderBy(desc(readmodelEserviceVersion.versionNumber))
          .limit(1)
          .as("latestEserviceVersion");

        const createFilterQuery = () =>
          tx
            .select({ eserviceId: readmodelEservice.id })
            .from(readmodelEservice)
            .leftJoin(
              readmodelEserviceCategory,
              eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
            )
            .innerJoinLateral(latestEserviceVersion, sql`true`)
            .where(
              and(
                producerId
                  ? eq(readmodelEservice.producerId, producerId)
                  : undefined,
                mode ? eq(readmodelEservice.mode, mode) : undefined,
                state && state.length > 0
                  ? inArray(latestEserviceVersion.state, state)
                  : undefined,
                q
                  ? or(
                      ilikeJsonB({ column: readmodelEservice.name, value: q }),
                      ilikeJsonB({
                        column: readmodelEservice.description,
                        value: q,
                      }),
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
            .$dynamic();

        const paginatedIds = createFilterQuery()
          .orderBy(...orderByFilters)
          .limit(limit)
          .offset(offset)
          .as("paginatedIds");

        const [queryRes, totalCount] = await Promise.all([
          tx
            .select({
              category: readmodelEserviceCategory,
              eservice: readmodelEservice,
            })
            .from(readmodelEservice)
            .innerJoin(
              paginatedIds,
              eq(readmodelEservice.id, paginatedIds.eserviceId),
            )
            .leftJoin(
              readmodelEserviceCategory,
              eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
            )
            .orderBy(...orderByFilters),
          getTableTotalCount(tx, createFilterQuery()),
        ]);

        const eservices = aggregateEservices(queryRes);

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
