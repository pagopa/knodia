import type { SQL } from "drizzle-orm";

import { genericInternalError } from "@knodia/common-models/errors";

export function assertSQLFiltersAreDefined(
  filters: SQL | undefined,
): asserts filters is SQL {
  if (filters === undefined) {
    throw genericInternalError("Filters cannot be undefined");
  }
}
