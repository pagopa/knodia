import type { InferSelectModel } from "drizzle-orm";

import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { readModelEserviceConfig } from "../config/config.ts";

export const eserviceSchema = pgSchema(
  readModelEserviceConfig.readModelDbEserviceSchema,
);

export const readmodelEservice = eserviceSchema.table(
  "eservice",
  {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    description: jsonb().notNull(),
    id: uuid().primaryKey().notNull(),
    isConsumerOperatorIdentificationRequired: boolean(
      "is_consumer_operator_identification_required",
    ).notNull(),
    isSignalHubEnabled: boolean("is_signal_hub_enabled").notNull(),
    metadataVersion: integer("metadata_version").notNull(),
    mode: text().notNull(),
    name: jsonb().notNull(),
    producerId: uuid("producer_id").notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    unique("eservice_id_metadata_v_unique").on(table.metadataVersion, table.id),
  ],
);

export const readmodelEserviceInterface = eserviceSchema.table(
  "eservice_interface",
  {
    checksum: text().notNull(),
    contentType: text("content_type").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    eserviceId: uuid("eservice_id").notNull(),
    eserviceVersionId: uuid("eservice_version_id").notNull(),
    id: uuid().primaryKey().notNull(),
    metadataVersion: integer("metadata_version").notNull(),
    name: text().notNull(),
    path: text().notNull(),
    prettyName: jsonb("pretty_name").notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.eserviceId],
      foreignColumns: [readmodelEservice.id],
      name: "eservice_interface_eservice_id_eservice_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.eserviceVersionId],
      foreignColumns: [readmodelEserviceVersion.id],
      name: "eservice_interface_eservice_v_id_eservice_v_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.eserviceId, table.metadataVersion],
      foreignColumns: [readmodelEservice.id, readmodelEservice.metadataVersion],
      name: "eservice_interface_eservice_id_metadata_v_fkey",
    }),
  ],
);

export const readmodelEserviceVersion = eserviceSchema.table(
  "eservice_version",
  {
    accessTokenAudience: text("access_token_audience").array().notNull(),
    accessTokenDuration: integer("access_token_duration").notNull(),
    accessTokenType: text("access_token_type").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    eserviceId: uuid("eservice_id").notNull(),
    id: uuid().primaryKey().notNull(),
    maxDailyCallsPerConsumer: integer("max_daily_calls_per_consumer").notNull(),
    maxDailyCallsPerKnode: integer("max_daily_calls_per_knode").notNull(),
    metadataVersion: integer("metadata_version").notNull(),
    state: text().notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    versionNumber: integer("version_number").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.eserviceId],
      foreignColumns: [readmodelEservice.id],
      name: "eservice_v_eservice_id_eservice_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.eserviceId, table.metadataVersion],
      foreignColumns: [readmodelEservice.id, readmodelEservice.metadataVersion],
      name: "eservice_v_eservice_id_metadata_v_fkey",
    }),
  ],
);

export const readmodelEserviceCategory = eserviceSchema.table(
  "eservice_category",
  {
    code: text().notNull(),
    eserviceId: uuid("eservice_id").notNull(),
    metadataVersion: integer("metadata_version").notNull(),
    scheme: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.eserviceId],
      foreignColumns: [readmodelEservice.id],
      name: "eservice_category_eservice_id_eservice_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.eserviceId, table.metadataVersion],
      foreignColumns: [readmodelEservice.id, readmodelEservice.metadataVersion],
      name: "eservice_category_eservice_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [
        table.scheme,
        table.metadataVersion,
        table.eserviceId,
        table.code,
      ],
      name: "eservice_category_pk",
    }),
  ],
);

export const readmodelEserviceVersionRequiredAttribute = eserviceSchema.table(
  "eservice_version_required_attribute",
  {
    code: text().notNull(),
    eserviceId: uuid("eservice_id").notNull(),
    eserviceVersionId: uuid("eservice_version_id").notNull(),
    groupId: integer("group_id").notNull(),
    metadataVersion: integer("metadata_version").notNull(),
    scheme: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.eserviceId],
      foreignColumns: [readmodelEservice.id],
      name: "eservice_v_req_attribute_eservice_id_eservice_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.eserviceVersionId],
      foreignColumns: [readmodelEserviceVersion.id],
      name: "eservice_v_req_attribute_eservice_v_id_eservice_v_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.eserviceId, table.metadataVersion],
      foreignColumns: [readmodelEservice.id, readmodelEservice.metadataVersion],
      name: "eservice_v_req_attribute_eservice_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [
        table.scheme,
        table.groupId,
        table.eserviceVersionId,
        table.code,
      ],
      name: "eservice_v_req_attribute_pk",
    }),
  ],
);

export type EserviceCategorySQL = InferSelectModel<
  typeof readmodelEserviceCategory
>;
export type EserviceInterfaceSQL = InferSelectModel<
  typeof readmodelEserviceInterface
>;
export interface EserviceItemsSQL {
  eserviceCategoriesSQL: EserviceCategorySQL[];
  eserviceInterfacesSQL: EserviceInterfaceSQL[];
  eserviceSQL: EserviceSQL;
  eserviceVersionRequiredAttributesSQL: EserviceVersionRequiredAttributeSQL[];
  eserviceVersionsSQL: EserviceVersionSQL[];
}
export type EserviceSQL = InferSelectModel<typeof readmodelEservice>;
export type EserviceVersionRequiredAttributeSQL = InferSelectModel<
  typeof readmodelEserviceVersionRequiredAttribute
>;
export type EserviceVersionSQL = InferSelectModel<
  typeof readmodelEserviceVersion
>;

export type NewReadmodelEservice = typeof readmodelEservice.$inferInsert;
export type NewReadmodelEserviceCategory =
  typeof readmodelEserviceCategory.$inferInsert;
export type NewReadmodelEserviceInterface =
  typeof readmodelEserviceInterface.$inferInsert;
export type NewReadmodelEserviceVersion =
  typeof readmodelEserviceVersion.$inferInsert;

export type NewReadmodelEserviceVersionRequiredAttribute =
  typeof readmodelEserviceVersionRequiredAttribute.$inferInsert;

export type ReadmodelEservice = typeof readmodelEservice.$inferSelect;
export type ReadmodelEserviceCategory =
  typeof readmodelEserviceCategory.$inferSelect;
export type ReadmodelEserviceInterface =
  typeof readmodelEserviceInterface.$inferSelect;
export type ReadmodelEserviceVersion =
  typeof readmodelEserviceVersion.$inferSelect;
export type ReadmodelEserviceVersionRequiredAttribute =
  typeof readmodelEserviceVersionRequiredAttribute.$inferSelect;
