import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { type EserviceId } from "@knodia/common-models/ids";
import { and, eq, gt } from "drizzle-orm";

import { toSignal } from "../converters/converters.ts";
import { type NewSignalHubSignal, signalHubSignal } from "../signalHub.ts";

export type SignalHubDbService = ReturnType<typeof signalHubDbServiceBuilder>;

export function signalHubDbServiceBuilder(db: NodePgDatabase) {
  return {
    async getNewerSignals(signalId: number, eserviceId: EserviceId) {
      return await db
        .select({ signalId: signalHubSignal.signalId })
        .from(signalHubSignal)
        .where(
          and(
            eq(signalHubSignal.eserviceId, eserviceId),
            gt(signalHubSignal.signalId, signalId),
          ),
        );
    },
    async getSignals(signalId: number, eserviceId: EserviceId, limit: number) {
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
        .limit(limit + 1);

      const nextSignalId =
        signals.length > limit ? signals.pop()?.signalId : undefined;
      const lastSignalId = signals.at(-1)?.signalId;

      return { lastSignalId, nextSignalId, signals: signals.map(toSignal) };
    },
    async insertSignal(signal: NewSignalHubSignal): Promise<void> {
      await db.insert(signalHubSignal).values(signal);
    },
  };
}
