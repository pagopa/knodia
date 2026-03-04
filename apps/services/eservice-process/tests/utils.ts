import type { TestToken } from "@knodia/test-commons/auth";

import { generateId } from "@knodia/common-models/ids";
import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import {
  AUTHORIZATION_HEADER,
  CORRELATION_ID_HEADER,
} from "@knodia/fastify-zod-api-commons/models";
import { createTestTokenPayload } from "@knodia/test-commons/auth";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllEserviceEvents() {
  return await eventStoreDb.select().from(eventStoreEserviceEvents);
}

export function injectAppRequest(spec: TestToken) {
  return app.inject().headers({
    [AUTHORIZATION_HEADER]: `Bearer ${createTestTokenPayload(spec)}`,
    [CORRELATION_ID_HEADER]: generateId(),
  });
}
