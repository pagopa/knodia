import { SignalType } from "@knodia/signal-hub-models";
import { match } from "ts-pattern";

import type { API_SignalType } from "./api.ts";

export function toSignalType(signalType: API_SignalType): SignalType {
  return match(signalType)
    .with("CREATE", () => SignalType.enum.Create)
    .with("UPDATE", () => SignalType.enum.Update)
    .with("DELETE", () => SignalType.enum.Delete)
    .with("SEEDUPDATE", () => SignalType.enum.SeedUpdate)
    .exhaustive();
}
