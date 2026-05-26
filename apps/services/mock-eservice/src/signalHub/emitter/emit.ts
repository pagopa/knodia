import { type CorrelationId, generateId } from "@knodia/common-models/ids";
import {
  type NewSignalHubSignal,
  signalHubSignal,
} from "@knodia/db-signal-hub";
import { SignalType } from "@knodia/signal-hub-models";
import { eq, max } from "drizzle-orm";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

import { rotatingFiscalCodes } from "../../data/rotatingAddresses.ts";
import { SIGNAL_HUB_MOCK_ESERVICE_ID } from "../mockup.ts";
import { signalHubMockPhaseAt } from "../phase.ts";
import { pseudonymize } from "../pseudonymize.ts";
import {
  computePeriodId,
  getRotatedSeed,
  type SignalHubSeedConfig,
} from "../rotation.ts";

interface EmitMockSignalsParams {
  db: NodePgDatabase;
  now: number;
  seedConfig: SignalHubSeedConfig;
}

interface EmittedBatch {
  correlationId: CorrelationId;
  periodId: number;
  seed: string;
  signalIds: number[];
}

export async function emitMockSignals({
  db,
  now,
  seedConfig,
}: EmitMockSignalsParams): Promise<EmittedBatch> {
  const periodId = computePeriodId(now, seedConfig);
  const seed = getRotatedSeed(SIGNAL_HUB_MOCK_ESERVICE_ID, now, seedConfig);
  const mockPhase = signalHubMockPhaseAt(periodId);
  const correlationId = generateId<CorrelationId>();

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ max: max(signalHubSignal.signalId) })
      .from(signalHubSignal)
      .where(eq(signalHubSignal.eserviceId, SIGNAL_HUB_MOCK_ESERVICE_ID));
    const startId = (row?.max ?? 0) + 1;

    const seedUpdateRow: NewSignalHubSignal = {
      correlationId,
      eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
      objectId: "",
      objectType: "",
      signalId: startId,
      signalType: SignalType.enum.SeedUpdate,
    };
    const mockSignalRows: NewSignalHubSignal[] = rotatingFiscalCodes.map(
      (fc, i) => ({
        correlationId,
        eserviceId: SIGNAL_HUB_MOCK_ESERVICE_ID,
        objectId: pseudonymize(fc, seed),
        objectType: "natural-persons/residence",
        signalId: startId + 1 + i,
        signalType: mockPhase,
      }),
    );

    await tx.insert(signalHubSignal).values([seedUpdateRow, ...mockSignalRows]);

    return {
      correlationId,
      periodId,
      seed,
      signalIds: [startId, ...mockSignalRows.map((r) => r.signalId)],
    };
  });
}
