// At every period transition the mock cron emits one phase signal per
// rotating fiscal code. The phase cycles `CREATE → UPDATE → DELETE`,
// matching the mock e-service's `/residence` rotation (address A → B → 404).

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
