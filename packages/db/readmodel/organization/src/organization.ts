import {
  bigint,
  foreignKey,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { readmodelOrganizationConfig } from "../config/config.ts";

const organizationSchema = pgSchema(
  readmodelOrganizationConfig.readmodelDbOrganizationSchema,
);

export const readmodelOrganization = organizationSchema.table(
  "organization",
  {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid().primaryKey().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: text().notNull(),
  },
  (table) => [
    unique("organization_id_metadata_v_unique").on(
      table.metadataVersion,
      table.id,
    ),
  ],
);

export const readmodelOrganizationAttribute = organizationSchema.table(
  "organization_attribute",
  {
    code: text().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    organizationId: uuid("organization_id").notNull(),
    scheme: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [readmodelOrganization.id],
      name: "organization_attribute_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.metadataVersion],
      foreignColumns: [
        readmodelOrganization.id,
        readmodelOrganization.metadataVersion,
      ],
      name: "organization_attribute_organization_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.code, table.organizationId, table.scheme],
      name: "organization_attribute_pk",
    }),
  ],
);

export type OrganizationAttributeSQL =
  typeof readmodelOrganizationAttribute.$inferSelect;

export type OrganizationSQL = typeof readmodelOrganization.$inferSelect;
