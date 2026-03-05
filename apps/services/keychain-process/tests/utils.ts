import { generateId } from "@knodia/common-models/ids";
import { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { createTestTokenPayload } from "@knodia/test-commons/auth";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllKeychainEvents() {
  return await eventStoreDb.select().from(eventStoreKeychainEvents);
}

export function injectAppRequest() {
  return app.inject().headers({
    authorization: `Bearer ${createTestTokenPayload({ type: "ui-session" })}`,
    [CORRELATION_ID_HEADER]: generateId(),
  });
}
