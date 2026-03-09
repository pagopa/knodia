import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { remoteResourceDbConfig } from "../config/config.ts";

const agreementSchema = pgSchema(
  remoteResourceDbConfig.remoteResourceDbAgreementSchema,
);

export const agreement = agreementSchema.table("agreement", {
  agreementId: uuid("agreement_id").primaryKey().notNull(),
  consumerId: uuid("consumer_id").notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  eserviceId: uuid("eservice_id").notNull(),
  eserviceVersionId: uuid("eservice_version_id").notNull(),
  knodeId: text("knode_id").notNull(),
  producerId: uuid("producer_id").notNull(),
});

export type AgreementSQL = typeof agreement.$inferSelect;
export type NewAgreementSQL = typeof agreement.$inferInsert;
