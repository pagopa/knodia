import { type EserviceId } from "@knodia/common-models/ids";
import { signalHubSignal } from "@knodia/db-signal-hub";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { randomUUID } from "node:crypto";

import { rotatingFiscalCodes } from "../mockup.ts";
import { phaseAt } from "../phase.ts";
import { pseudonymize } from "../pseudonymize.ts";
import {
  computePeriodId,
  getRotatedSeed,
  type SignalHubSeedConfig,
} from "../rotation.ts";
import { SignalType } from "../signal.ts";
import { type SignalIdAllocator } from "./counter.ts";

interface EmittedBatch {
  correlationId: string;
  periodId: number;
  seed: string;
  signalIds: number[];
}

interface EmitTransitionParams {
  allocator: SignalIdAllocator;
  db: NodePgDatabase;
  eserviceId: EserviceId;
  now: number;
  seedConfig: SignalHubSeedConfig;
}

// One DB transaction: 1 SEEDUPDATE marker + N phase signals, one per rotating
// fiscal code. All rows share a `correlation_id` so a consumer can group them.
// `signal_id`s are contiguous from the allocator; the UNIQUE constraint on
// `(eservice_id, signal_id)` is the safety net.
export async function emitTransition({
  allocator,
  db,
  eserviceId,
  now,
  seedConfig,
}: EmitTransitionParams): Promise<EmittedBatch> {
  const periodId = computePeriodId(now, seedConfig);
  const seed = getRotatedSeed(eserviceId, now, seedConfig);
  const phase = phaseAt(periodId);
  const correlationId = randomUUID();

  const seedUpdateId = allocator.next();
  const phaseRows = rotatingFiscalCodes.map((fc) => ({
    correlationId,
    eserviceId,
    objectId: pseudonymize(fc, seed),
    objectType: "residence",
    signalId: allocator.next(),
    signalType: phase,
  }));

  await db.transaction(async (tx) => {
    await tx.insert(signalHubSignal).values([
      {
        correlationId,
        eserviceId,
        objectId: "",
        objectType: "",
        signalId: seedUpdateId,
        signalType: SignalType.enum.SEEDUPDATE,
      },
      ...phaseRows,
    ]);
  });

  return {
    correlationId,
    periodId,
    seed,
    signalIds: [seedUpdateId, ...phaseRows.map((r) => r.signalId)],
  };
}
