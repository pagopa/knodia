import { SignalType } from "./signal.ts";

export const PHASE_CYCLE_LENGTH = 3;

export function phaseAt(
  periodId: number,
): Exclude<SignalType, typeof SignalType.enum.SeedUpdate> {
  switch (periodId % PHASE_CYCLE_LENGTH) {
    case 0:
      return SignalType.enum.Create;
    case 1:
      return SignalType.enum.Update;
    default:
      return SignalType.enum.Delete;
  }
}
