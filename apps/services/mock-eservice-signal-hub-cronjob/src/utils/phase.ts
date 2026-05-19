// The Signal Hub mock cron emits one phase signal per rotating fiscal code at
// every period transition. The phase cycles `CREATE → UPDATE → DELETE`,
// matching the rotation observable on the mock e-service's `/residence`
// (address A → address B → 404).

const PHASE_CYCLE_LENGTH = 3;
type Phase = "CREATE" | "DELETE" | "UPDATE";

export function phaseAt(periodId: number): Phase {
  // `periodId` is structurally non-negative — `SEED_START_DATE_MS` is
  // validated `<= Date.now()` at config parse time, so no defensive
  // (((x % N) + N) % N) wrap needed.
  switch (periodId % PHASE_CYCLE_LENGTH) {
    case 0:
      return "CREATE";
    case 1:
      return "UPDATE";
    default:
      return "DELETE";
  }
}
