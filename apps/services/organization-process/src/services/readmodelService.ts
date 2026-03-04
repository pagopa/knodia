import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { organizationReadmodelServiceBuilder } from "@knodia/db-readmodel-organization/services";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return organizationReadmodelServiceBuilder(readmodelDb);
}
