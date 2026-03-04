import {
  bigint,
  pgSchema,
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
