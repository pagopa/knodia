import type { SQL } from "drizzle-orm";

import { genericInternalError } from "@knodia/common-models/errors";

export function assertSQLFilterIsDefined(
  filter: SQL | undefined,
): asserts filter is SQL {
  if (filter === undefined) {
    throw genericInternalError("Filter cannot be undefined");
  }
}
