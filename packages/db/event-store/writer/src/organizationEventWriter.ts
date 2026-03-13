import type { OrganizationId } from "@knodia/common-models/ids";
import type { OrganizationEventV1 } from "@knodia/organization-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eventStoreOrganizationEvents } from "@knodia/db-event-store-organization";

import {
  eventStoreWriterBuilder,
  type NewEventStoreEvent,
} from "./eventWriter.ts";

export type NewEventStoreOrganizationEvent = NewEventStoreEvent<
  OrganizationEventV1,
  OrganizationId
>;
export type OrganizationEventStoreWriter = ReturnType<
  typeof organizationEventStoreWriterBuilder
>;

export const organizationEventStoreWriterBuilder = (db: NodePgDatabase) =>
  eventStoreWriterBuilder({
    db,
    eventsTable: eventStoreOrganizationEvents,
  });
