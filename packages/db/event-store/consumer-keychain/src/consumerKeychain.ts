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

import { eventStoreConsumerKeychainConfig } from "../config/config.ts";

export const consumerKeychainSchema = pgSchema(
  eventStoreConsumerKeychainConfig.eventStoreDbConsumerKeychainSchema,
);

export const eventStoreConsumerKeychainEvents = consumerKeychainSchema.table(
  "events",
  {
    correlationId: text("correlation_id").notNull(),
    data: eventStoreBytea("data").notNull(),
    logDate: timestamp("log_date", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    sequenceNum: bigserial("sequence_num", { mode: "number" })
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
