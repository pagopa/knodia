import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllEserviceEvents() {
  return await eventStoreDb.select().from(eventStoreEserviceEvents);
}

export function injectAppRequest() {
  return app.inject().headers({
    [CORRELATION_ID_HEADER]: crypto.randomUUID(),
  });
}
