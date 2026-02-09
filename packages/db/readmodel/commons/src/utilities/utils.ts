import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { genericInternalError } from "@knodia/common-models/errors";
import {
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  type InferSelectModel,
  sql,
  SQL,
} from "drizzle-orm";
import { toCamelCase } from "drizzle-orm/casing";
import {
  type AnyPgColumn,
  type AnyPgTable,
  getTableConfig,
  PgColumn,
  PgTable,
} from "drizzle-orm/pg-core";
import { match } from "ts-pattern";
import z from "zod";

export const checkMetadataVersion = async (
  tx: NodePgDatabase,
  table: AnyPgTable & {
    id: AnyPgColumn;
    metadataVersion: AnyPgColumn<{ data: number }>;
  },
  metadataVersion: number,
  id: string,
): Promise<boolean> =>
  await checkMetadataVersionByFilter(
    tx,
    table,
    metadataVersion,
    eq(table.id, id),
  );

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

export const getTablePKColumns = (table: AnyPgTable): string[] => {
  const tableConfig = getTableConfig(table);
  const pk = tableConfig.primaryKeys[0];
  const pkColumns: string[] = [];
  const tableColumns = getTableColumns(table);

  if (!pk) {
    Object.entries(tableColumns).forEach(([name, column]) => {
      if (column.primary) {
        pkColumns.push(name);
      }
    });
  } else {
    pkColumns.push(...pk.columns.map((col) => toCamelCase(col.name)));
  }

  if (pkColumns.length === 0) {
    throw genericInternalError(
      `Table ${tableConfig.name} does not have a primary key`,
    );
  }

  return pkColumns;
};

// TODO: uncomment when needed
// export const throwIfMultipleOrEmpty = <T extends { id: string }>(
//   items: T[],
//   entityName: string,
// ): T => {
//   if (items.length === 0) {
//     throw genericInternalError(
//       `No ${entityName} found for the given unique filter`,
//     );
//   }

//   if (items.length > 1) {
//     const ids = items.map((item) => item.id).join(", ");
//     throw genericInternalError(
//       `Found more than one ${entityName} for a unique filter: ${ids}`,
//     );
//   }

//   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//   return items[0]!;
// };

export function aggregateByPKString<
  Table extends AnyPgTable,
  T extends InferSelectModel<Table> & Record<string, unknown>,
>(subRow: null | T, pkSet: Set<string>, subRows: T[], table: Table): void {
  if (subRow !== null) {
    const key = getTablePKString(subRow, table);
    if (!pkSet.has(key)) {
      pkSet.add(key);
      subRows.push(subRow);
    }
  }
}

export function assertSQLFilterIsDefined(
  filter: SQL | undefined,
): asserts filter is SQL {
  if (filter === undefined) {
    throw genericInternalError("Filter cannot be undefined");
  }
}

function getTablePKString<T extends Record<string, unknown>>(
  modelSQL: T,
  table: AnyPgTable,
): string {
  const tableConfig = getTableConfig(table);
  return getTablePKColumns(table)
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

export const SortDirection = z.enum(["asc", "desc"]);
export type SortDirection = z.infer<typeof SortDirection>;

export const lowerCase = (column: PgColumn): SQL =>
  sql<string>`LOWER(${column})`;
export const ascLower = (column: PgColumn): SQL => asc(lowerCase(column));
const descLower = (column: PgColumn): SQL => desc(lowerCase(column));

export const createOrderByFilters = ({
  sortBy,
  sortOrder,
  table,
}: {
  sortBy: string;
  sortOrder: string;
  table: PgTable;
}): SQL[] => {
  const sortColumns = [sortBy];
  const sortDirections: SortDirection[] = [SortDirection.parse(sortOrder)];

  const pkColumns = getTablePKColumns(table);
  pkColumns.forEach((col) => {
    const columnName = toCamelCase(col);
    if (!sortColumns.includes(columnName)) {
      sortColumns.push(columnName);
      sortDirections.push(SortDirection.enum.asc);
    }
  });

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

  return sortColumns.map((sortColumn, i) => {
    const column = getExistingColumn(sortColumn, tableColumns);

    return match(SortDirection.parse(sortDirections[i]))
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
  table: AnyPgTable,
): Promise<number> {
  const totalCountResult = await db
    .select({
      count: count(),
    })
    .from(table)
    .limit(1);

  return totalCountResult[0]?.count ?? 0;
}

export function ilikeJsonB(column: PgColumn, value: string): SQL {
  return sql`jsonb_path_exists(${column}, '$.** ? (@.type() == "string" && @ like_regex "${escapeRegExp(value)}" flag "i")')`;
}
