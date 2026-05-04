import {
  bigint,
  bigserial,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { signalHubStoreDbConfig } from "./config/config.ts";

const signalHubStoreSchema = pgSchema(
  signalHubStoreDbConfig.signalHubStoreDbSchema,
);

export const signalHubSignal = signalHubStoreSchema.table(
  "signal",
  {
    correlationId: uuid("correlation_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
    eserviceId: uuid("eservice_id").notNull(),
    id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
    objectId: text("object_id").notNull(),
    objectType: text("object_type").notNull(),
    signalId: bigint("signal_id", { mode: "number" }).notNull(),
    signalType: text("signal_type").notNull(),
  },
  (table) => [
    unique("signal_eservice_id_signal_id_key").on(
      table.eserviceId,
      table.signalId,
    ),
  ],
);

export type NewSignalHubSignal = typeof signalHubSignal.$inferInsert;

export type SignalHubSignalSQL = typeof signalHubSignal.$inferSelect;
