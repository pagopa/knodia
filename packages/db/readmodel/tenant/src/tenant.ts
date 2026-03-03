import {
  bigint,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { readmodelTenantConfig } from "../config/config.ts";

const tenantSchema = pgSchema(readmodelTenantConfig.readmodelDbTenantSchema);

export const readmodelTenant = tenantSchema.table(
  "tenant",
  {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid().primaryKey().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: text().notNull(),
  },
  (table) => [
    unique("tenant_id_metadata_v_unique").on(table.metadataVersion, table.id),
  ],
);
