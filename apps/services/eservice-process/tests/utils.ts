import type { OrganizationId } from "@knodia/common-models/ids";

import { generateId } from "@knodia/common-models/ids";
import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import {
  AUTHORIZATION_HEADER,
  CORRELATION_ID_HEADER,
} from "@knodia/fastify-zod-api-commons/models";
import {
  createTestTokenPayload,
  getTestUISessionTokenClaims,
} from "@knodia/test-commons/auth";
import { UnsecuredJWT } from "jose";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllEserviceEvents() {
  return await eventStoreDb.select().from(eventStoreEserviceEvents);
}

export function injectAppRequest(organizationId?: OrganizationId) {
  const token = organizationId
    ? createTokenWithOrgId(organizationId)
    : createTestTokenPayload("ui-session");

  return app.inject().headers({
    [AUTHORIZATION_HEADER]: `Bearer ${token}`,
    [CORRELATION_ID_HEADER]: generateId(),
  });
}

function createTokenWithOrgId(organizationId: OrganizationId): string {
  return new UnsecuredJWT({
    ...getTestUISessionTokenClaims(),
    organizationId,
  }).encode();
}
