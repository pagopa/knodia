import { SignalType } from "./signal.ts";

const PHASE_CYCLE_LENGTH = 3;

// `periodId` is structurally non-negative — `SIGNAL_HUB_SEED_START_DATE_MS`
// is validated `<= Date.now()` at config parse — so no defensive
// (((x % N) + N) % N) wrap is needed.
export function phaseAt(periodId: number): SignalType {
  switch (periodId % PHASE_CYCLE_LENGTH) {
    case 0:
      return SignalType.enum.CREATE;
    case 1:
      return SignalType.enum.UPDATE;
    default:
      return SignalType.enum.DELETE;
  }
}
