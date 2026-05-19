import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { type EserviceId } from "@knodia/common-models/ids";
import { and, eq, gt, max } from "drizzle-orm";

import { toSignal } from "../converters/converters.ts";
import { type NewSignalHubSignal, signalHubSignal } from "../signalHub.ts";

export type SignalHubDbService = ReturnType<typeof signalHubDbServiceBuilder>;

export function signalHubDbServiceBuilder(db: NodePgDatabase) {
  return {
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

      const nextSignalId =
        signals.length > size ? signals.pop()?.signalId : undefined;
      const lastSignalId = signals.at(-1)?.signalId;

      return { lastSignalId, nextSignalId, signals: signals.map(toSignal) };
    },
    async insertSignal(signal: NewSignalHubSignal): Promise<void> {
      await db.insert(signalHubSignal).values(signal);
    },
  };
}
