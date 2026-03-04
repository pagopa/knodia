import { generateId } from "@knodia/common-models/ids";
import { eventStoreAgreementEvents } from "@knodia/db-event-store-agreement";
import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  createTestTokenPayload,
  type TestToken,
} from "@knodia/test-commons/auth";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllAgreementEvents() {
  return await eventStoreDb.select().from(eventStoreAgreementEvents);
}

export function injectAppRequest(spec: TestToken) {
  return app.inject().headers({
    authorization: `Bearer ${createTestTokenPayload(spec)}`,
    [CORRELATION_ID_HEADER]: generateId(),
  });
}
