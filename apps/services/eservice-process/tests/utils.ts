import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllEserviceEvents() {
  return await eventStoreDb.select().from(eventStoreEserviceEvents);
}

export const injectAppRequest = createInjectAppRequest(app);
