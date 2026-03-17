import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import { aggregatePurposes } from "@knodia/db-readmodel-purpose/converters";

export async function getAllPurposes(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      purpose: readmodelPurpose,
    })
    .from(readmodelPurpose);

  return aggregatePurposes(queryRes);
}
