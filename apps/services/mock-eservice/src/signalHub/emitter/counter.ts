import { type EserviceId } from "@knodia/common-models/ids";
import { signalHubSignal } from "@knodia/db-signal-hub";
import { eq, max } from "drizzle-orm";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

export interface SignalIdAllocator {
  next: () => number;
}

export async function loadMaxSignalId(
  db: NodePgDatabase,
  eserviceId: EserviceId,
): Promise<number> {
  const [row] = await db
    .select({ max: max(signalHubSignal.signalId) })
    .from(signalHubSignal)
    .where(eq(signalHubSignal.eserviceId, eserviceId));
  return row?.max ?? 0;
}

export function makeSignalIdAllocator(startingFrom: number): SignalIdAllocator {
  let n = startingFrom;
  return {
    next: () => ++n,
  };
}
