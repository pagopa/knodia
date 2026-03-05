import { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllKeychainEvents() {
  return await eventStoreDb.select().from(eventStoreKeychainEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);
