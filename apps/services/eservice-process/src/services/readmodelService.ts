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
} from "@knodia/db-readmodel-eservice";
import {
  aggregateEservices,
  toCompactEserviceVersion,
} from "@knodia/db-readmodel-eservice/converters";
import { type CompactEservice } from "@knodia/eservice-models";
import {
  and,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";

import type { API_GetEservicesQueryParams } from "../models/api.ts";

import { eserviceNotFound, eserviceVersionNotFound } from "../models/errors.ts";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(
  readmodelDb: NodePgDatabase,
  eserviceReadmodelService: EserviceReadmodelService,
) {
  return {
    async getEservice(
      eserviceId: EserviceId,
    ): Promise<WithMetadata<CompactEservice>> {
      const eservice =
        await eserviceReadmodelService.getEServiceById(eserviceId);

      if (!eservice) {
        throw eserviceNotFound(eserviceId);
      }

      return eservice;
    },
    async getEserviceLatestVersion(eserviceId: EserviceId) {
      const queryResult = await readmodelDb
        .select(getTableColumns(readmodelEserviceVersion))
        .from(readmodelEserviceVersion)
        .where(eq(readmodelEserviceVersion.eserviceId, eserviceId))
        .orderBy(desc(readmodelEserviceVersion.versionNumber))
        .limit(1);

      const eserviceVersionSQL = queryResult[0];
      if (!eserviceVersionSQL) {
        throw eserviceVersionNotFound(eserviceId);
      }
      return toCompactEserviceVersion(eserviceVersionSQL);
    },
    async getEservices(
      params: API_GetEservicesQueryParams,
    ): Promise<ListResult<CompactEservice>> {
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
