import {
  bigint,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { readmodelPurposeConfig } from "../config/config.ts";

export const purposeSchema = pgSchema(
  readmodelPurposeConfig.readmodelDbPurposeSchema,
);

export const readmodelPurpose = purposeSchema.table(
  "purpose",
  {
    consumerId: uuid("consumer_id").notNull(),
    consumerKnodeId: text("consumer_knode_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    dailyCalls: integer("daily_calls").notNull(),
    description: jsonb().notNull(),
    eserviceId: uuid("eservice_id").notNull(),
    formAnswersJson: jsonb("form_answers_json").notNull(),
    id: uuid().primaryKey().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: jsonb().notNull(),
    state: text().notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    unique("purpose_id_metadata_v_unique").on(table.id, table.metadataVersion),
  ],
);

export type NewReadmodelPurpose = typeof readmodelPurpose.$inferInsert;

export interface PurposeItemsSQL {
  purposeSQL: PurposeSQL;
}
export type PurposeSQL = typeof readmodelPurpose.$inferSelect;
