import type { UserRole } from "@knodia/common-models/auth";
import type { NonEmptyArray } from "@knodia/common-models/types";

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

export function injectAppRequest(
  roles: NonEmptyArray<UserRole> = ["administrative"],
) {
  return app.inject().headers({
    [AUTHORIZATION_HEADER]: `Bearer ${createTestTokenPayload("ui-session", { roles })}`,
    [CORRELATION_ID_HEADER]: generateId(),
  });
}
