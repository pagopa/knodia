import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import {
  type ObjectSignalType,
  type Signal,
  type SignalSeed,
  SignalType,
} from "@knodia/signal-hub-models";
import { match } from "ts-pattern";

import {
  type API_ObjectSignalType,
  type API_PullResponse,
  type API_Signal,
  API_SignalType,
} from "./api.ts";

export function fromAPI_Signal(apiSignal: API_Signal): SignalSeed {
  return match(apiSignal)
    .with(
      { signalType: API_SignalType.enum.SEEDUPDATE },
      ({ eserviceId, signalId }) => ({
        eserviceId: unsafeBrandId<EserviceId>(eserviceId),
        signalId,
        signalType: SignalType.enum.SeedUpdate,
      }),
    )
    .with(
      { signalType: API_SignalType.enum.CREATE },
      { signalType: API_SignalType.enum.UPDATE },
      { signalType: API_SignalType.enum.DELETE },
      ({ eserviceId, objectId, objectType, signalId, signalType }) => ({
        eserviceId: unsafeBrandId<EserviceId>(eserviceId),
        objectId,
        objectType,
        signalId,
        signalType: fromAPI_ObjectSignalType(signalType),
      }),
    )
    .exhaustive();
}

export function toAPI_PullResponse(
  lastSignalId: number | undefined,
  signals: Signal[],
): API_PullResponse {
  return {
    lastSignalId,
    signals: signals.map(toAPI_Signal),
  };
}

function fromAPI_ObjectSignalType(
  signalType: API_ObjectSignalType,
): ObjectSignalType {
  return match(signalType)
    .with(API_SignalType.enum.CREATE, () => SignalType.enum.Create)
    .with(API_SignalType.enum.UPDATE, () => SignalType.enum.Update)
    .with(API_SignalType.enum.DELETE, () => SignalType.enum.Delete)
    .exhaustive();
}

function toAPI_ObjectSignalType(
  signalType: ObjectSignalType,
): API_ObjectSignalType {
  return match(signalType)
    .with(SignalType.enum.Create, () => API_SignalType.enum.CREATE)
    .with(SignalType.enum.Update, () => API_SignalType.enum.UPDATE)
    .with(SignalType.enum.Delete, () => API_SignalType.enum.DELETE)
    .exhaustive();
}

function toAPI_Signal(signal: Signal): API_Signal {
  return match(signal)
    .with(
      { signalType: SignalType.enum.SeedUpdate },
      ({ eserviceId, signalId }) => ({
        eserviceId,
        signalId,
        signalType: API_SignalType.enum.SEEDUPDATE,
      }),
    )
    .with(
      { signalType: SignalType.enum.Create },
      { signalType: SignalType.enum.Update },
      { signalType: SignalType.enum.Delete },
      ({ eserviceId, objectId, objectType, signalId, signalType }) => ({
        eserviceId,
        objectId,
        objectType,
        signalId,
        signalType: toAPI_ObjectSignalType(signalType),
      }),
    )
    .exhaustive();
}
