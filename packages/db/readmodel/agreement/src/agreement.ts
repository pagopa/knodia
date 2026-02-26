import {
  bigint,
  foreignKey,
  integer,
  pgSchema,
  primaryKey,
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
    consumerKnodeId: text("consumer_knode_id").notNull(),
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

export const readmodelAgreementRequiredAttribute = agreementSchema.table(
  "agreement_required_attribute",
  {
    agreementId: uuid("agreement_id").notNull(),
    code: text().notNull(),
    groupId: integer("group_id").notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    scheme: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.agreementId],
      foreignColumns: [readmodelAgreement.id],
      name: "agreement_req_attribute_agreement_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.agreementId, table.metadataVersion],
      foreignColumns: [
        readmodelAgreement.id,
        readmodelAgreement.metadataVersion,
      ],
      name: "agreement_req_attribute_agreement_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.code, table.agreementId, table.groupId, table.scheme],
      name: "agreement_req_attribute_pk",
    }),
  ],
);

export interface AgreementItemsSQL {
  agreementSQL: AgreementSQL;
  requiredAttributesSQL: AgreementRequiredAttributeSQL[];
}
export type AgreementRequiredAttributeSQL =
  typeof readmodelAgreementRequiredAttribute.$inferSelect;
export type AgreementSQL = typeof readmodelAgreement.$inferSelect;
