import {
  type NewSignalHubSignal,
  signalHubSignal,
} from "@knodia/db-signal-hub";
import { randomUUID } from "node:crypto";

import { signalHubDb, signalHubDbService } from "./setup.ts";

export async function getAllSignals() {
  return await signalHubDb
    .select()
    .from(signalHubSignal)
    .orderBy(signalHubSignal.id);
}

let signalIdCounter = 1;

export async function seedSignals(
  signals: (Partial<NewSignalHubSignal> & { createdAt: Date })[],
) {
  for (const { createdAt, ...overrides } of signals) {
    await signalHubDbService.insertSignal({
      correlationId: randomUUID(),
      createdAt,
      eserviceId: randomUUID(),
      objectId: "obj",
      objectType: "residence",
      signalId: signalIdCounter++,
      signalType: "UPDATE",
      ...overrides,
    });
  }
}
