import type { UserRole } from "@knodia/common-models/auth";
import type { OrganizationId } from "@knodia/common-models/ids";
import type { NonEmptyArray } from "@knodia/common-models/types";

import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllEserviceEvents() {
  return await eventStoreDb.select().from(eventStoreEserviceEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);

export function injectAppRequestWithOrganizationId(
  organizationId: OrganizationId,
  roles: NonEmptyArray<UserRole> = ["technical"],
) {
  return injectAppRequest({ organizationId, roles, type: "ui-session" });
}
