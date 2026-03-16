import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import { aggregatePurpose } from "@knodia/db-readmodel-purpose/converters";

export async function getAllPurposes(readmodelDb: NodePgDatabase) {
  const queryRes = await readmodelDb
    .select({
      purpose: readmodelPurpose,
    })
    .from(readmodelPurpose);

  // aggregatePurpose handles single results; for multiple, collect individually
  return queryRes.map((row) => aggregatePurpose([row])).filter(Boolean);
}
