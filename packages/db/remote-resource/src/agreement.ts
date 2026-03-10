import { pgSchema, primaryKey, text, uuid } from "drizzle-orm/pg-core";

import { remoteResourceDbConfig } from "./config.ts";

const agreementSchema = pgSchema(
  remoteResourceDbConfig.remoteResourceDbAgreementSchema,
);

export const agreement = agreementSchema.table(
  "agreement",
  {
    agreementId: uuid("agreement_id").notNull(),
    consumerId: uuid("consumer_id").notNull(),
    eserviceId: uuid("eservice_id").notNull(),
    eserviceVersionId: uuid("eservice_version_id").notNull(),
    knodeId: text("knode_id").notNull(),
    producerId: uuid("producer_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.knodeId, table.agreementId],
      name: "agreement_pk",
    }),
  ],
);

export type NewAgreementSQL = typeof agreement.$inferInsert;
