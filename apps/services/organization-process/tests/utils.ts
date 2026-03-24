import type { Organization } from "@knodia/organization-models";

import { generateId } from "@knodia/common-models/ids";
import { eventStoreOrganizationEvents } from "@knodia/db-event-store-organization";
import { organizationEventStoreWriterBuilder } from "@knodia/db-event-store-writer/organization";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import { expect } from "vitest";

import { createOrganizationCreatedV1Event } from "../src/models/organizationEventFactory.ts";
import { app, eventStoreDb, organizationWriterService } from "./setup.ts";

export async function getAllOrganizationEvents() {
  return await eventStoreDb.select().from(eventStoreOrganizationEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);

export async function seedOrganization(organization: Organization) {
  await organizationEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createOrganizationCreatedV1Event(organization, generateId()),
  );
  await organizationWriterService.upsertOrganization(organization, 0);
}

export const toExpectAPI_Organization = (org: Organization) => ({
  attributes: expect.arrayContaining(org.attributes),
  createdAt: org.createdAt.toISOString(),
  id: org.id,
  name: org.name,
  updatedAt: org.updatedAt.toISOString(),
});
