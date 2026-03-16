import type { PurposeId } from "@knodia/common-models/ids";
import type { PurposeEventV1 } from "@knodia/purpose-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eventStorePurposeEvents } from "@knodia/db-event-store-purpose";

import {
  eventStoreWriterBuilder,
  type NewEventStoreEvent,
} from "./eventWriter.ts";

export type NewEventStorePurposeEvent = NewEventStoreEvent<
  PurposeEventV1,
  PurposeId
>;
export type PurposeEventStoreWriter = ReturnType<
  typeof purposeEventStoreWriterBuilder
>;

export const purposeEventStoreWriterBuilder = (db: NodePgDatabase) =>
  eventStoreWriterBuilder({
    db,
    eventsTable: eventStorePurposeEvents,
  });
