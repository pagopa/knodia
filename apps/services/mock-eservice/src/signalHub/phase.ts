import { SignalType } from "@knodia/signal-hub-models";
import { match } from "ts-pattern";

export const SIGNAL_HUB_MOCK_PHASES = 3;

export function signalHubMockPhaseAt(
  periodId: number,
): Exclude<SignalType, typeof SignalType.enum.SeedUpdate> {
  return match(periodId % SIGNAL_HUB_MOCK_PHASES)
    .with(0, () => SignalType.enum.Create)
    .with(1, () => SignalType.enum.Update)
    .with(2, () => SignalType.enum.Delete)
    .otherwise((index) => {
      throw new Error(
        `Unexpected phase index ${index} for periodId ${periodId}`,
      );
    });
}
