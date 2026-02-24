import {
  bigint,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { readmodelAgreementConfig } from "../config/config.ts";

export const agreementSchema = pgSchema(
  readmodelAgreementConfig.readmodelDbAgreementSchema,
);

export const readmodelAgreement = agreementSchema.table(
  "agreement",
  {
    consumerId: uuid("consumer_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    eserviceId: uuid("eservice_id").notNull(),
    eserviceVersionId: uuid("eservice_version_id").notNull(),
    id: uuid().primaryKey().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    producerId: uuid("producer_id").notNull(),
    state: text().notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    unique("agreement_id_metadata_v_unique").on(
      table.id,
      table.metadataVersion,
    ),
  ],
);
