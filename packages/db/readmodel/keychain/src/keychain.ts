import type { InferSelectModel } from "drizzle-orm";

import {
  bigint,
  foreignKey,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { readmodelKeychainConfig } from "../config/config.ts";

export const keychainSchema = pgSchema(
  readmodelKeychainConfig.readmodelDbKeychainSchema,
);

export const readmodelKeychain = keychainSchema.table(
  "keychain",
  {
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    description: jsonb(),
    id: uuid().primaryKey().notNull(),
    kind: text().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: jsonb().notNull(),
    ownerId: uuid("owner_id").notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    unique("keychain_id_metadata_v_unique").on(table.metadataVersion, table.id),
  ],
);

export const readmodelKeychainUser = keychainSchema.table(
  "keychain_user",
  {
    keychainId: uuid("keychain_id").notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.keychainId],
      foreignColumns: [readmodelKeychain.id],
      name: "keychain_user_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.keychainId, table.metadataVersion],
      foreignColumns: [readmodelKeychain.id, readmodelKeychain.metadataVersion],
      name: "keychain_user_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.userId, table.metadataVersion, table.keychainId],
      name: "keychain_user_pk",
    }),
  ],
);

export const readmodelKeychainPurpose = keychainSchema.table(
  "keychain_purpose",
  {
    keychainId: uuid("keychain_id").notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    purposeId: uuid("purpose_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.keychainId],
      foreignColumns: [readmodelKeychain.id],
      name: "keychain_purpose_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.keychainId, table.metadataVersion],
      foreignColumns: [readmodelKeychain.id, readmodelKeychain.metadataVersion],
      name: "keychain_purpose_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.purposeId, table.metadataVersion, table.keychainId],
      name: "keychain_purpose_pk",
    }),
  ],
);

export const readmodelKeychainKey = keychainSchema.table(
  "keychain_key",
  {
    algorithm: text().notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    encodedPem: text().notNull(),
    format: text().notNull(),
    keychainId: uuid("keychain_id").notNull(),
    kid: text().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: jsonb().notNull(),
    use: text().notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.keychainId],
      foreignColumns: [readmodelKeychain.id],
      name: "keychain_key_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.keychainId, table.metadataVersion],
      foreignColumns: [readmodelKeychain.id, readmodelKeychain.metadataVersion],
      name: "keychain_key_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.keychainId, table.kid],
      name: "keychain_key_pkey",
    }),
  ],
);

export interface KeychainItemsSQL {
  keychainKeysSQL: KeychainKeySQL[];
  keychainPurposesSQL: KeychainPurposeSQL[];
  keychainSQL: KeychainSQL;
  keychainUsersSQL: KeychainUserSQL[];
}

export type KeychainKeySQL = InferSelectModel<typeof readmodelKeychainKey>;
export type KeychainPurposeSQL = InferSelectModel<
  typeof readmodelKeychainPurpose
>;
export type KeychainSQL = InferSelectModel<typeof readmodelKeychain>;
export type KeychainUserSQL = InferSelectModel<typeof readmodelKeychainUser>;

export type NewReadmodelKeychain = typeof readmodelKeychain.$inferInsert;
export type NewReadmodelKeychainKey = typeof readmodelKeychainKey.$inferInsert;
export type NewReadmodelKeychainPurpose =
  typeof readmodelKeychainPurpose.$inferInsert;
export type NewReadmodelKeychainUser =
  typeof readmodelKeychainUser.$inferInsert;

export type ReadmodelKeychain = typeof readmodelKeychain.$inferSelect;
export type ReadmodelKeychainKey = typeof readmodelKeychainKey.$inferSelect;
export type ReadmodelKeychainPurpose =
  typeof readmodelKeychainPurpose.$inferSelect;
export type ReadmodelKeychainUser = typeof readmodelKeychainUser.$inferSelect;
