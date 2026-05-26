import { unsafeBrandId } from "@knodia/common-models/ids";
import { type Signal, SignalType } from "@knodia/signal-hub-models";

import type { SignalHubSignalSQL } from "../signalHub.ts";

export function toSignal(signalSQL: SignalHubSignalSQL): Signal {
  return {
    createdAt: signalSQL.createdAt,
    eserviceId: unsafeBrandId(signalSQL.eserviceId),
    objectId: signalSQL.objectId,
    objectType: signalSQL.objectType,
    signalId: signalSQL.signalId,
    signalType: SignalType.parse(signalSQL.signalType),
  };
}
