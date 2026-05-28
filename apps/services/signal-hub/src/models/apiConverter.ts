import { type Signal, SignalType } from "@knodia/signal-hub-models";
import { match } from "ts-pattern";

import {
  type API_PullResponse,
  type API_Signal,
  API_SignalType,
} from "./api.ts";

export function toAPI_PullResponse(
  lastSignalId: number | undefined,
  signals: Signal[],
): API_PullResponse {
  return {
    lastSignalId,
    signals: signals.map(toAPI_Signal),
  };
}

export function toSignalType(signalType: API_SignalType): SignalType {
  return match(signalType)
    .with("CREATE", () => SignalType.enum.Create)
    .with("UPDATE", () => SignalType.enum.Update)
    .with("DELETE", () => SignalType.enum.Delete)
    .with("SEEDUPDATE", () => SignalType.enum.SeedUpdate)
    .exhaustive();
}

function toAPI_Signal(signal: Signal): API_Signal {
  return {
    eserviceId: signal.eserviceId,
    objectId: signal.objectId,
    objectType: signal.objectType,
    signalId: signal.signalId,
    signalType: toAPI_SignalType(signal.signalType),
  };
}

function toAPI_SignalType(signalType: SignalType): API_SignalType {
  return match(signalType)
    .with(SignalType.enum.Create, () => API_SignalType.enum.CREATE)
    .with(SignalType.enum.Update, () => API_SignalType.enum.UPDATE)
    .with(SignalType.enum.Delete, () => API_SignalType.enum.DELETE)
    .with(SignalType.enum.SeedUpdate, () => API_SignalType.enum.SEEDUPDATE)
    .exhaustive();
}
