import { type CorrelationId, generateId } from "@knodia/common-models/ids";
import { signalHubSignal } from "@knodia/db-signal-hub";
import { eq, max } from "drizzle-orm";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

import { rotatingFiscalCodes } from "../../data/rotatingAddresses.ts";
import { SIGNAL_HUB_MOCK_ESERVICE_ID } from "../mockup.ts";
import { phaseAt } from "../phase.ts";
import { pseudonymize } from "../pseudonymize.ts";
import {
  computePeriodId,
  getRotatedSeed,
  type SignalHubSeedConfig,
} from "../rotation.ts";
import { SignalType } from "../signal.ts";

interface EmittedBatch {
  correlationId: CorrelationId;
  periodId: number;
  seed: string;
  signalIds: number[];
}

interface EmitTransitionParams {
  db: NodePgDatabase;
  now: number;
  seedConfig: SignalHubSeedConfig;
}

export async function emitTransition({
  db,
  now,
  seedConfig,
}: EmitTransitionParams): Promise<EmittedBatch> {
  const periodId = computePeriodId(now, seedConfig);
  const seed = getRotatedSeed(SIGNAL_HUB_MOCK_ESERVICE_ID, now, seedConfig);
  const phase = phaseAt(periodId);
  const correlationId = generateId<CorrelationId>();

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ max: max(signalHubSignal.signalId) })
      .from(signalHubSignal)
      .where(eq(signalHubSignal.eserviceId, SIGNAL_HUB_MOCK_ESERVICE_ID));
    const startId = (row?.max ?? 0) + 1;

    const seedUpdateRow = {
      correlationId,
      eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
      objectId: "",
      objectType: "",
      signalId: startId,
      signalType: SignalType.enum.SEEDUPDATE,
    };
    const phaseRows = rotatingFiscalCodes.map((fc, i) => ({
      correlationId,
      eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
      objectId: pseudonymize(fc, seed),
      objectType: "residence",
      signalId: startId + 1 + i,
      signalType: phase,
    }));

    await tx.insert(signalHubSignal).values([seedUpdateRow, ...phaseRows]);

    return {
      correlationId,
      periodId,
      seed,
      signalIds: [startId, ...phaseRows.map((r) => r.signalId)],
    };
  });
}
