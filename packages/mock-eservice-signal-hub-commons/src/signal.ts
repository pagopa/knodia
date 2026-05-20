import { z } from "zod";

// Every Signal Hub signal carries a `signalType`. The cron writes
// `SEEDUPDATE` markers + one phase signal per period transition; future
// push/pull consumers will read the same set.
export const SignalType = z.enum(["CREATE", "DELETE", "SEEDUPDATE", "UPDATE"]);
export type SignalType = z.infer<typeof SignalType>;

// Phase signals are the rotation-driven subset (no SEEDUPDATE).
export const SignalPhase = SignalType.exclude(["SEEDUPDATE"]);
export type SignalPhase = z.infer<typeof SignalPhase>;
