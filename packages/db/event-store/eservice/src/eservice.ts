import { eventStoreBytea } from "@knodia/db-event-store-config/utils";
import {
  bigint,
  bigserial,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { eventStoreEserviceConfig } from "../config/config.ts";

export const eserviceSchema = pgSchema(
  eventStoreEserviceConfig.eventStoreDbEserviceSchema,
);

export const eventStoreEserviceEvents = eserviceSchema.table(
  "events",
  {
    correlationId: text("correlation_id").notNull(),
    data: eventStoreBytea("data").notNull(),
    logDate: timestamp("log_date", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    sequenceNum: bigserial("sequence_num", { mode: "bigint" })
      .primaryKey()
      .notNull(),
    streamId: uuid("stream_id").notNull(),
    type: text().notNull(),
    version: bigint({ mode: "number" }).notNull(),
  },
  (table) => [
    unique("events_stream_id_version_unique").on(table.version, table.streamId),
  ],
);

export type EventsInLocalEservice =
  typeof eventStoreEserviceEvents.$inferSelect;
export type NewEventsInLocalEservice =
  typeof eventStoreEserviceEvents.$inferInsert;
