import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { genericInternalError } from "@knodia/common-models/errors";
import { eq, SQL } from "drizzle-orm";
import {
  type AnyPgColumn,
  type AnyPgTable,
  getTableConfig,
} from "drizzle-orm/pg-core";

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

const getTablePKColumns = (
  tableConfig: ReturnType<typeof getTableConfig>,
): string[] => {
  console.log(tableConfig.primaryKeys);
  const pk = tableConfig.primaryKeys[0];
  if (!pk) {
    throw genericInternalError(
      `Table ${tableConfig.name} primary key is not defined`,
    );
  }
  return pk.columns.map((col) => col.name);
};

export function getTablePKString<T extends Record<string, unknown>>(
  modelSQL: T,
  table: AnyPgTable,
): string {
  const tableConfig = getTableConfig(table);
  return getTablePKColumns(tableConfig)
    .map((col) => {
      const key = snakeToCamel(col) as keyof T;
      const value = modelSQL[key];
      if (value === undefined || value === null) {
        throw genericInternalError(
          `Missing PK column '${col}' in ${tableConfig.name}`,
        );
      }
      return String(value);
    })
    .join("|");
}

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

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
