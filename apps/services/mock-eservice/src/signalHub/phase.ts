import { SignalType } from "./signal.ts";

export const SIGNAL_HUB_MOCK_PHASES = 3;

export function signalHubMockPhaseAt(
  periodId: number,
): Exclude<SignalType, typeof SignalType.enum.SeedUpdate> {
  switch (periodId % SIGNAL_HUB_MOCK_PHASES) {
    case 0:
      return SignalType.enum.Create;
    case 1:
      return SignalType.enum.Update;
    default:
      return SignalType.enum.Delete;
  }
}
