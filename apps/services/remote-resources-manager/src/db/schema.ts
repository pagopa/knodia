import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { resourceManagerDbConfig } from "../../config/config.ts";

const agreementSchema = pgSchema(
  resourceManagerDbConfig.resourceManagerDbAgreementSchema,
);

export const agreement = agreementSchema.table("agreement", {
  agreementId: uuid("agreement_id").primaryKey().notNull(),
  consumerId: uuid("consumer_id").notNull(),
  eserviceId: uuid("eservice_id").notNull(),
  eserviceVersionId: uuid("eservice_version_id").notNull(),
  knodeId: text("knode_id").notNull(),
  producerId: uuid("producer_id").notNull(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
});
