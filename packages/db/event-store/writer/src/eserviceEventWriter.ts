import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { type EserviceId } from "@knodia/common-models/ids";
import { EserviceEventV1 } from "@knodia/eservice-models";

import type { NewEventStoreEvent } from "./eventWriter.ts";

import { eventStoreEserviceEvents } from "../../eservice/src/eservice.ts";
import { eventStoreWriterBuilder } from "./eventWriter.ts";

export type EserviceEventStoreWriter = ReturnType<
  typeof eserviceEventStoreWriterBuilder
>;

export type NewEventStoreEserviceEvent<TEvent extends EserviceEventV1> =
  NewEventStoreEvent<TEvent, EserviceId>;

export function eserviceEventStoreWriterBuilder(db: NodePgDatabase) {
  const writer = eventStoreWriterBuilder({
    db,
    eventEncoder: EserviceEventV1.encode,
    eventsTable: eventStoreEserviceEvents,
  });

  return {
    insertEserviceEvent: writer.insertEvent,
  };
}
