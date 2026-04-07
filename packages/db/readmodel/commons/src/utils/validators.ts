import type { SQL } from "drizzle-orm";

import { genericInternalError } from "@knodia/common-models/errors";

// Drizzle filters like and(...) are typed as SQL | undefined: https://github.com/drizzle-team/drizzle-orm/issues/2120
export function assertSQLFiltersAreDefined(
  filters: SQL | undefined,
): asserts filters is SQL {
  if (filters === undefined) {
    throw genericInternalError("Filters cannot be undefined");
  }
}
