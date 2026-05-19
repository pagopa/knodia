import { type EserviceId } from "@knodia/common-models/ids";
import { signalHubSignal } from "@knodia/db-signal-hub";
import { rotatingFiscalCodes } from "@knodia/mock-eservice-signal-hub-commons/mockup";
import { phaseAt } from "@knodia/mock-eservice-signal-hub-commons/phase";
import { pseudonymize } from "@knodia/mock-eservice-signal-hub-commons/pseudonymize";
import {
  getRotatedSeed,
  type SignalHubSeedConfig,
} from "@knodia/mock-eservice-signal-hub-commons/rotation";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { randomUUID } from "node:crypto";

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
  periodId: number;
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
  periodId,
  seedConfig,
}: EmitTransitionParams): Promise<EmittedBatch> {
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
        signalType: "SEEDUPDATE",
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
