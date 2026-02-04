import type { LocalizedText } from "@knodia/common-models/localization";
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
    description: jsonb().$type<LocalizedText>().notNull(),
    id: uuid().primaryKey(),
    isConsumerOperatorIdentificationRequired: boolean(
      "is_consumer_operator_identification_required",
    ).notNull(),
    isSignalHubEnabled: boolean("is_signal_hub_enabled").notNull(),
    metadataVersion: integer("metadata_version").notNull(),
    mode: text().notNull(),
    name: jsonb().$type<LocalizedText>().notNull(),
    producerId: uuid("producer_id").notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [unique().on(table.id, table.metadataVersion)],
);

export const readmodelEserviceCategory = eserviceSchema.table(
  "eservice_category",
  {
    code: text().notNull(),
    eserviceId: uuid("eservice_id")
      .notNull()
      .references(() => readmodelEservice.id, { onDelete: "cascade" }),
    metadataVersion: integer("metadata_version").notNull(),
    scheme: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.eserviceId, table.metadataVersion],
      foreignColumns: [readmodelEservice.id, readmodelEservice.metadataVersion],
      name: "eservice_category_eservice_id_metadata_version_fkey",
    }),
    primaryKey({
      columns: [
        table.eserviceId,
        table.metadataVersion,
        table.scheme,
        table.code,
      ],
      name: "eservice_category_pk",
    }),
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
    eserviceId: uuid("eservice_id")
      .notNull()
      .references(() => readmodelEservice.id, { onDelete: "cascade" }),
    eserviceVersionId: uuid("eservice_version_id")
      .notNull()
      .references(() => readmodelEserviceVersion.id, { onDelete: "cascade" }),
    id: uuid().primaryKey(),
    metadataVersion: integer("metadata_version").notNull(),
    name: text().notNull(),
    path: text().notNull(),
    prettyName: jsonb("pretty_name").$type<LocalizedText>().notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.eserviceId, table.metadataVersion],
      foreignColumns: [readmodelEservice.id, readmodelEservice.metadataVersion],
      name: "eservice_interface_eservice_id_metadata_version_fkey",
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
    eserviceId: uuid("eservice_id")
      .notNull()
      .references(() => readmodelEservice.id, { onDelete: "cascade" }),
    id: uuid().primaryKey(),
    maxDailyCallsPerConsumer: integer("max_daily_calls_per_consumer").notNull(),
    maxDailyCallsPerKnode: integer("max_daily_calls_per_knode").notNull(),
    metadataVersion: integer("metadata_version").notNull(),
    state: text("state").notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    versionNumber: integer("version_number").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.eserviceId, table.metadataVersion],
      foreignColumns: [readmodelEservice.id, readmodelEservice.metadataVersion],
      name: "eservice_version_eservice_id_metadata_version_fkey",
    }),
  ],
);

export const readmodelEserviceVersionRequiredAttribute = eserviceSchema.table(
  "eservice_version_required_attribute",
  {
    code: text().notNull(),
    eserviceId: uuid("eservice_id")
      .notNull()
      .references(() => readmodelEservice.id, { onDelete: "cascade" }),
    eserviceVersionId: uuid("eservice_version_id")
      .notNull()
      .references(() => readmodelEserviceVersion.id, { onDelete: "cascade" }),
    groupId: integer("group_id").notNull(),
    metadataVersion: integer("metadata_version").notNull(),
    scheme: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.eserviceId, table.metadataVersion],
      foreignColumns: [readmodelEservice.id, readmodelEservice.metadataVersion],
      name: "eservice_version_required_attribute_eservice_id_metadata_version_fkey",
    }),
    primaryKey({
      columns: [
        table.eserviceVersionId,
        table.groupId,
        table.scheme,
        table.code,
      ],
      name: "eservice_version_required_attribute_pk",
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
