import type { IDS } from "@knodia/common-models/ids";

import { genericInternalError } from "@knodia/common-models/errors";
import { type ReadmodelConfig } from "@knodia/db-readmodel-config/config";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  type InferSelectModel,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import { toCamelCase } from "drizzle-orm/casing";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  type AnyPgColumn,
  type AnyPgTable,
  getTableConfig,
  type PgColumn,
  PgJsonb,
  type PgSelect,
  type PgTable,
  PgText,
} from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { match } from "ts-pattern";

import { SortDirection } from "../models/models.ts";

export const makeReadmodelDrizzleConnection = (
  config: ReadmodelConfig,
): { db: NodePgDatabase; pool: Pool } => {
  const pool = new Pool({
    database: config.readmodelDbName,
    host: config.readmodelDbHost,
    password: config.readmodelDbPassword,
    port: config.readmodelDbPort,
    ssl: config.readmodelDbUseSsl ? { rejectUnauthorized: false } : undefined,
    user: config.readmodelDbUser,
  });

  return { db: drizzle(pool), pool };
};

export const checkMetadataVersion = async ({
  id,
  metadataVersion,
  table,
  tableIdColumn,
  tx,
}: {
  id: string;
  metadataVersion: number;
  table: AnyPgTable & {
    metadataVersion: AnyPgColumn<{ data: number }>;
  };
  tableIdColumn: AnyPgColumn;
  tx: NodePgDatabase;
}): Promise<boolean> => {
  const columns = Object.values(getTableColumns(table));
  if (!columns.includes(tableIdColumn)) {
    throw genericInternalError(
      `tableIdColumn ${tableIdColumn.name} does not belong to the provided table ${getTableConfig(table).name}`,
    );
  }

  return await checkMetadataVersionByFilter(
    tx,
    table,
    metadataVersion,
    eq(tableIdColumn, id),
  );
};

const checkMetadataVersionByFilter = async (
  tx: NodePgDatabase,
  table: AnyPgTable & {
    metadataVersion: AnyPgColumn<{ data: number }>;
  },
  metadataVersion: number,
  filter: SQL | undefined,
): Promise<boolean> => {
  if (filter === undefined) {
    throw genericInternalError("Filter cannot be undefined");
  }
  const [row] = await tx
    .select({
      metadataVersion: table.metadataVersion,
    })
    .from(table)
    .where(filter);

  const existingMetadataVersion = row?.metadataVersion;

  if (existingMetadataVersion == null) {
    return true;
  }
  return existingMetadataVersion <= metadataVersion;
};

const getTablePKColumns = (table: AnyPgTable): Map<string, PgColumn> => {
  const tableConfig = getTableConfig(table);
  const pk = tableConfig.primaryKeys[0];
  const pkColumns = new Map<string, PgColumn>();

  if (!pk) {
    const tableColumns = getTableColumns(table);
    Object.entries(tableColumns).forEach(([name, column]) => {
      if (column.primary) {
        pkColumns.set(name, column);
      }
    });
  } else {
    pk.columns.forEach((col) => {
      pkColumns.set(toCamelCase(col.name), col);
    });
  }

  if (pkColumns.size === 0) {
    throw genericInternalError(
      `Table ${tableConfig.name} primary key not found`,
    );
  }

  return pkColumns;
};

export const throwIfMultiple = <T>(
  items: T[],
  entityName: string,
  getId: (item: T) => string,
): T | undefined => {
  if (items.length > 1) {
    const ids = items.map(getId).join(", ");
    throw genericInternalError(
      `Found more than one ${entityName} for a unique filter: ${ids}`,
    );
  }
  return items[0];
};

export const throwIfMultipleOrEmpty = <T>(
  items: T[],
  entityName: string,
  getId: (item: T) => string,
): T => {
  const result = throwIfMultiple(items, entityName, getId);
  if (result === undefined) {
    throw genericInternalError(
      `No ${entityName} found for the given unique filter`,
    );
  }
  return result;
};

export function aggregateByPKString<
  Table extends AnyPgTable,
  T extends InferSelectModel<Table> & Record<string, unknown>,
>(
  subRow: null | T | undefined,
  pkSet: Set<string>,
  subRows: T[],
  table: Table,
): void {
  if (subRow !== null && subRow !== undefined) {
    const key = getTablePKString(subRow, table);
    if (!pkSet.has(key)) {
      pkSet.add(key);
      subRows.push(subRow);
    }
  }
}

export function getTablePKString<T extends Record<string, unknown>>(
  modelSQL: T,
  table: AnyPgTable,
): string {
  const tableConfig = getTableConfig(table);
  return Array.from(getTablePKColumns(table).keys())
    .map((col) => {
      const value = modelSQL[col];
      if (value === undefined || value === null) {
        throw genericInternalError(
          `Missing PK column '${col}' in ${tableConfig.name}`,
        );
      }
      return String(value);
    })
    .join("|");
}

const lowerCaseJsonb = (column: PgColumn, key: string): SQL<string> =>
  sql<string>`LOWER(${column} ->> ${key})`;
const lowerCase = (column: PgColumn): SQL => sql<string>`LOWER(${column})`;
const ascLower = (column: PgColumn): SQL => {
  if (column instanceof PgJsonb) {
    return asc(lowerCaseJsonb(column, "en"));
  } else if (column instanceof PgText) {
    return asc(lowerCase(column));
  }
  return asc(column);
};
const descLower = (column: PgColumn): SQL => {
  if (column instanceof PgJsonb) {
    return desc(lowerCaseJsonb(column, "en"));
  } else if (column instanceof PgText) {
    return desc(lowerCase(column));
  }
  return desc(column);
};

export const createOrderByFilters = ({
  sortBy,
  sortOrder,
  table,
}: {
  sortBy: string;
  sortOrder: string;
  table: PgTable;
}): SQL[] => {
  const sorts: {
    column: string;
    direction: SortDirection;
  }[] = [
    {
      column: sortBy,
      direction: SortDirection.parse(sortOrder),
    },
  ];

  const pkColumns = getTablePKColumns(table);
  for (const [colName] of pkColumns) {
    if (!sorts.some((s) => s.column === colName)) {
      sorts.push({
        column: colName,
        direction: SortDirection.enum.asc,
      });
    }
  }

  function getExistingColumn(
    sortColumn: string,
    columns: typeof tableColumns,
  ): PgColumn {
    if (!(sortColumn in columns) || !columns[sortColumn]) {
      throw genericInternalError(`Sort column ${sortColumn} does not exist`);
    }

    return columns[sortColumn];
  }

  const tableColumns = getTableColumns(table);

  return sorts.map(({ column: sortColumn, direction }) => {
    const column = getExistingColumn(sortColumn, tableColumns);

    return match(direction)
      .with(SortDirection.enum.asc, () => ascLower(column))
      .with(SortDirection.enum.desc, () => descLower(column))
      .exhaustive();
  });
};

export function escapeRegExp(str: string): string {
  return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}

export async function getTableTotalCount(
  db: NodePgDatabase,
  query: PgSelect,
): Promise<number> {
  const totalCountResult = await db
    .select({
      count: count(),
    })
    .from(query.as("filterQuery"))
    .limit(1);

  return totalCountResult[0]?.count ?? 0;
}

export function ilikeJsonB({
  column,
  value,
}: {
  column: PgColumn;
  value: string;
}): SQL {
  const pattern = `%${escapeRegExp(value)}%`;

  return sql`
    exists (
      select 1
      from jsonb_each_text(${column}) as t(key, value)
      where t.value ilike ${pattern}
    )
  `;
}

export const updateMetadataVersionInTables = async <
  T extends AnyPgTable & {
    $inferInsert: { metadataVersion: number };
    metadataVersion: AnyPgColumn<{ data: number }>;
  },
>({
  db,
  getIdColumn,
  id,
  newMetadataVersion,
  tables,
}: {
  db: NodePgDatabase;
  getIdColumn: (table: T) => AnyPgColumn;
  id: IDS;
  newMetadataVersion: number;
  tables: T[];
}): Promise<void> => {
  for (const table of tables) {
    const idColumn = getIdColumn(table);

    await db
      .update(table)
      .set({
        metadataVersion: newMetadataVersion,
      })
      .where(
        and(eq(idColumn, id), lte(table.metadataVersion, newMetadataVersion)),
      );
  }
};
