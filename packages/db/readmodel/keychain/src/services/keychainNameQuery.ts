import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
  OrganizationId,
  ProducerKeychainId,
} from "@knodia/common-models/ids";
import type { LocalizedName } from "@knodia/keychain-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";

import { ilikeJsonBExact } from "@knodia/db-readmodel-commons/utils";
import { and, eq, ne } from "drizzle-orm";

export type KeychainId =
  | ConsumerKeychainId
  | KnodeApiKeychainId
  | ProducerKeychainId;

export interface KeychainWithNameExistsQuery {
  excludeKeychainId?: KeychainId;
  name: LocalizedName;
  ownerId: OrganizationId;
}

export async function keychainWithNameExists(
  readmodelDb: NodePgDatabase,
  table: AnyPgTable & {
    id: AnyPgColumn;
    name: AnyPgColumn;
    ownerId: AnyPgColumn;
  },
  { excludeKeychainId, name, ownerId }: KeychainWithNameExistsQuery,
): Promise<boolean> {
  const queryRes = await readmodelDb
    .select({ id: table.id })
    .from(table)
    .where(
      and(
        eq(table.ownerId, ownerId),
        ilikeJsonBExact({ column: table.name, value: name.en }),
        excludeKeychainId ? ne(table.id, excludeKeychainId) : undefined,
      ),
    )
    .limit(1);

  return queryRes.length > 0;
}
