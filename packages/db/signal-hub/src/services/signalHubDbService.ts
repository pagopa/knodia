import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { type EserviceId } from "@knodia/common-models/ids";
import { and, eq, gt, lt } from "drizzle-orm";

import { type NewSignalHubSignal, signalHubSignal } from "../signalHub.ts";

export type SignalHubDbService = ReturnType<typeof signalHubDbServiceBuilder>;

export function signalHubDbServiceBuilder(db: NodePgDatabase) {
  return {
    async getRecentSignalsWithHigherId(
      eserviceId: EserviceId,
      signalId: number,
      timeWindowInSeconds: number,
    ) {
      const cutoff = new Date(Date.now() - timeWindowInSeconds * 1000);

      return await db
        .select({ signalId: signalHubSignal.signalId })
        .from(signalHubSignal)
        .where(
          and(
            eq(signalHubSignal.eserviceId, eserviceId),
            gt(signalHubSignal.signalId, signalId),
            lt(signalHubSignal.createdAt, cutoff),
          ),
        );
    },
    async getSignal(signalId: number, eserviceId: EserviceId) {
      const rows = await db
        .select()
        .from(signalHubSignal)
        .where(
          and(
            eq(signalHubSignal.signalId, signalId),
            eq(signalHubSignal.eserviceId, eserviceId),
          ),
        )
        .limit(1);
      return rows[0];
    },
    async insertSignal(signal: NewSignalHubSignal): Promise<void> {
      await db.insert(signalHubSignal).values(signal);
    },
  };
}
