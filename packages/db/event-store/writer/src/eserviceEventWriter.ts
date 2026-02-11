import type { EserviceId } from "@knodia/common-models/ids";
import type { EserviceEventV1 } from "@knodia/eservice-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eserviceEvents } from "@knodia/db-event-store-eservice";

import {
  eventStoreWriterBuilder,
  type NewEventStoreEvent,
} from "./eventWriter.ts";

export type EserviceEventStoreWriter = ReturnType<
  typeof eserviceEventStoreWriterBuilder
>;
export type NewEventStoreEserviceEvent = NewEventStoreEvent<
  EserviceEventV1,
  EserviceId
>;

export const eserviceEventStoreWriterBuilder = (db: NodePgDatabase) =>
  eventStoreWriterBuilder({
    db,
    eventsTable: eserviceEvents,
  });
