import { signalHubSignal } from "@knodia/db-signal-hub";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import { app, signalHubDb } from "./setup.ts";

export const injectAppRequest = createInjectAppRequest(() => app);

export async function getAllSignals() {
  return await signalHubDb
    .select()
    .from(signalHubSignal)
    .orderBy(signalHubSignal.id);
}
