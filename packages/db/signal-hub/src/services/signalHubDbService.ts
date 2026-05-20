import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { type EserviceId } from "@knodia/common-models/ids";
import { eq, lte, max } from "drizzle-orm";

import { type NewSignalHubSignal, signalHubSignal } from "../signalHub.ts";

export type SignalHubDbService = ReturnType<typeof signalHubDbServiceBuilder>;

export function signalHubDbServiceBuilder(db: NodePgDatabase) {
  return {
    async deleteSignals(cutoffDate: Date): Promise<number> {
      const result = await db
        .delete(signalHubSignal)
        .where(lte(signalHubSignal.createdAt, cutoffDate));

      return result.rowCount ?? 0;
    },
    async getMaxSignalId(eserviceId: EserviceId): Promise<number> {
      const [row] = await db
        .select({ max: max(signalHubSignal.signalId) })
        .from(signalHubSignal)
        .where(eq(signalHubSignal.eserviceId, eserviceId));

      return row?.max ?? 0;
    },
    async insertSignal(signal: NewSignalHubSignal): Promise<void> {
      await db.insert(signalHubSignal).values(signal);
    },
  };
}
