import { sql } from "drizzle-orm";
import {
  bigint,
  check,
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
    formSchemaVersion: text("form_schema_version").notNull(),
    id: uuid().primaryKey().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: jsonb().notNull(),
    state: text().notNull(),
    suspendedByConsumerAt: timestamp("suspended_by_consumer_at", {
      mode: "date",
      withTimezone: true,
    }),
    suspendedByProducerAt: timestamp("suspended_by_producer_at", {
      mode: "date",
      withTimezone: true,
    }),
    templateId: uuid("template_id"),
    templateKnodeId: text("template_knode_id"),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    unique("purpose_id_metadata_v_unique").on(table.id, table.metadataVersion),
    check(
      "purpose_template_fields_check",
      sql`(
        (${table.templateId} IS NULL) = (${table.templateKnodeId} IS NULL)
      )`,
    ),
  ],
);

export type NewReadmodelPurpose = typeof readmodelPurpose.$inferInsert;

export interface PurposeItemsSQL {
  purposeSQL: PurposeSQL;
}
export type PurposeSQL = typeof readmodelPurpose.$inferSelect;
