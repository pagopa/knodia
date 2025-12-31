import {
  pgSchema,
  uuid,
  bigint,
  bigserial,
  text,
  customType,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const eserviceSchema = pgSchema("eservice");

// Helper for bytea needed in version 0.45.1, but type is supported in beta versions >= 1.0.0-beta.6
// Should be released soon according to Drizzle ORM team: https://orm.drizzle.team/roadmap
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const eserviceEvents = eserviceSchema.table(
  "events",
  {
    sequenceNum: bigserial("sequence_num", { mode: "bigint" }).primaryKey(),

    streamId: uuid("stream_id").notNull(),
    version: bigint("version", { mode: "bigint" }).notNull(),

    correlationId: text("correlation_id"),

    type: text("type").notNull(),
    data: bytea("data").notNull(),

    logDate: timestamp("log_date", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("events_stream_id_version_unique").on(table.streamId, table.version),
  ]
);
