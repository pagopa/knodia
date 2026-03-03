import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { tenantReadmodelServiceBuilder } from "@knodia/db-readmodel-tenant/services";

export type ReadmodelService = ReturnType<typeof readmodelServiceBuilder>;

export function readmodelServiceBuilder(readmodelDb: NodePgDatabase) {
  return tenantReadmodelServiceBuilder(readmodelDb);
}
