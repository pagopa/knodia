import { Signal } from "@knodia/signal-hub-models";

import type { SignalHubSignalSQL } from "../signalHub.ts";

export function toSignal(signalSQL: SignalHubSignalSQL): Signal {
  // Omit the object columns when null so the SeedUpdate branch (which has none) parses.
  return Signal.parse({
    createdAt: signalSQL.createdAt,
    eserviceId: signalSQL.eserviceId,
    signalId: signalSQL.signalId,
    signalType: signalSQL.signalType,
    ...(signalSQL.objectId !== null && { objectId: signalSQL.objectId }),
    ...(signalSQL.objectType !== null && { objectType: signalSQL.objectType }),
  });
}
