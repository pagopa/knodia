import { SignalType } from "./signal.ts";

const PHASE_CYCLE_LENGTH = 3;

export function phaseAt(periodId: number): SignalType {
  switch (periodId % PHASE_CYCLE_LENGTH) {
    case 0:
      return SignalType.enum.Create;
    case 1:
      return SignalType.enum.Update;
    default:
      return SignalType.enum.Delete;
  }
}
