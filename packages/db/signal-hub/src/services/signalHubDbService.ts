import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { type EserviceId } from "@knodia/common-models/ids";
import { and, eq, gt, lte, max } from "drizzle-orm";

import { toSignal } from "../converters/converters.ts";
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
    async getSignals(signalId: number, eserviceId: EserviceId, size: number) {
      const signals = await db
        .select()
        .from(signalHubSignal)
        .where(
          and(
            gt(signalHubSignal.signalId, signalId),
            eq(signalHubSignal.eserviceId, eserviceId),
          ),
        )
        .orderBy(signalHubSignal.signalId)
        .limit(size + 1);

      const hasMoreSignals = signals.length > size;
      const page = hasMoreSignals ? signals.slice(0, size) : signals;
      return {
        hasMoreSignals,
        lastSignalId: page.at(-1)?.signalId,
        signals: page.map(toSignal),
      };
    },
    async insertSignal(signal: NewSignalHubSignal): Promise<void> {
      await db.insert(signalHubSignal).values(signal);
    },
  };
}
