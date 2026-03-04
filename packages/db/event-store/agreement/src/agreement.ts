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

import { eventStoreAgreementConfig } from "../config/config.ts";

export const agreementSchema = pgSchema(
  eventStoreAgreementConfig.eventStoreDbAgreementSchema,
);

export const eventStoreAgreementEvents = agreementSchema.table(
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
    unique("events_stream_id_version_unique").on(table.streamId, table.version),
  ],
);
