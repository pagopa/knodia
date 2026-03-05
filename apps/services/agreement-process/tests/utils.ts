import { eventStoreAgreementEvents } from "@knodia/db-event-store-agreement";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllAgreementEvents() {
  return await eventStoreDb.select().from(eventStoreAgreementEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);
