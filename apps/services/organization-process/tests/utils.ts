import type { Organization } from "@knodia/organization-models";

import { eventStoreOrganizationEvents } from "@knodia/db-event-store-organization";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import { expect } from "vitest";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllOrganizationEvents() {
  return await eventStoreDb.select().from(eventStoreOrganizationEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);

export const toExpectAPI_Organization = (org: Organization) => ({
  attributes: expect.arrayContaining(org.attributes),
  createdAt: org.createdAt.toISOString(),
  id: org.id,
  name: org.name,
  updatedAt: org.updatedAt.toISOString(),
});
