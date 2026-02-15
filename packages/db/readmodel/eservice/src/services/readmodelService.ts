import type { EserviceId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { CompactEservice } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgSelect } from "drizzle-orm/pg-core";

import {
  assertSQLFilterIsDefined,
  createOrderByFilters,
} from "@knodia/db-readmodel-commons/utils";
import { eq, getTableColumns, type SQL } from "drizzle-orm";

import { toCompactEservice } from "../converters/converters.ts";
import {
  readmodelEservice,
  readmodelEserviceCategory,
  readmodelEserviceInterface,
  readmodelEserviceVersion,
  readmodelEserviceVersionRequiredAttribute,
} from "../eservice.ts";

export type EserviceReadmodelService = ReturnType<
  typeof eserviceReadmodelServiceBuilder
>;

export function eserviceReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return {
    async getEServiceByFilter(
      filter: SQL | undefined,
    ): Promise<undefined | WithMetadata<CompactEservice>> {
      assertSQLFilterIsDefined(filter);

      const queryResult = await getEServicesQueryResult({
        dataFilters: filter,
        readmodelDb,
      });

      const eserviceSQL = queryResult[0];
      if (!eserviceSQL) {
        return undefined;
      }

      return toCompactEservice(eserviceSQL);
    },
    async getEServiceById(
      eserviceId: EserviceId,
    ): Promise<undefined | WithMetadata<CompactEservice>> {
      return await this.getEServiceByFilter(
        eq(readmodelEservice.id, eserviceId),
      );
    },
  };
}

function addEserviceLeftJoinsToQuery<T extends PgSelect>(query: T) {
  return query
    .leftJoin(
      readmodelEserviceCategory,
      eq(readmodelEservice.id, readmodelEserviceCategory.eserviceId),
    )
    .leftJoin(
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
      readmodelEserviceVersionRequiredAttribute,
      eq(
        readmodelEserviceVersion.id,
        readmodelEserviceVersionRequiredAttribute.eserviceVersionId,
      ),
    );
}

function getEServicesQueryResult({
  dataFilters,
  paginationFilters,
  readmodelDb,
  sortingFilters,
}: {
  dataFilters: SQL;
  // TODO: create types for these filters
  paginationFilters?: { limit: number; offset: number };
  readmodelDb: NodePgDatabase;
  sortingFilters?: { sortBy: string; sortOrder: "asc" | "desc" };
}) {
  const orderByFilters = sortingFilters
    ? createOrderByFilters({
        ...sortingFilters,
        table: readmodelEservice,
      })
    : [];

  const query = addEserviceLeftJoinsToQuery(
    readmodelDb
      .select(getTableColumns(readmodelEservice))
      .from(readmodelEservice)
      .where(dataFilters)
      .orderBy(...orderByFilters)
      .$dynamic(),
  );

  return paginationFilters
    ? query.limit(paginationFilters.limit).offset(paginationFilters.offset)
    : query;
}
