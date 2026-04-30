import type { InferSelectModel } from "drizzle-orm";

import {
  bigint,
  foreignKey,
  jsonb,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { keychainSchema } from "./schema.ts";

export const readmodelKnodiaApiKeychain = keychainSchema.table(
  "knodia_api_keychain",
  {
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    description: jsonb(),
    id: uuid().primaryKey().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: jsonb().notNull(),
    ownerId: uuid("owner_id").notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    unique("knodia_api_keychain_id_metadata_v_unique").on(
      table.metadataVersion,
      table.id,
    ),
  ],
);

export const readmodelKnodiaApiKeychainUser = keychainSchema.table(
  "knodia_api_keychain_user",
  {
    addedAt: timestamp("added_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    knodiaApiKeychainId: uuid("knodia_api_keychain_id").notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.knodiaApiKeychainId],
      foreignColumns: [readmodelKnodiaApiKeychain.id],
      name: "knodia_api_keychain_user_knodia_api_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.knodiaApiKeychainId, table.metadataVersion],
      foreignColumns: [
        readmodelKnodiaApiKeychain.id,
        readmodelKnodiaApiKeychain.metadataVersion,
      ],
      name: "knodia_api_keychain_user_knodia_api_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.userId, table.metadataVersion, table.knodiaApiKeychainId],
      name: "knodia_api_keychain_user_pk",
    }),
  ],
);

export const readmodelKnodiaApiKeychainKey = keychainSchema.table(
  "knodia_api_keychain_key",
  {
    algorithm: text().notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    encodedPem: text("encoded_pem").notNull(),
    format: text().notNull(),
    kid: text().notNull(),
    knodiaApiKeychainId: uuid("knodia_api_keychain_id").notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: jsonb().notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.knodiaApiKeychainId],
      foreignColumns: [readmodelKnodiaApiKeychain.id],
      name: "knodia_api_keychain_key_knodia_api_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.knodiaApiKeychainId, table.metadataVersion],
      foreignColumns: [
        readmodelKnodiaApiKeychain.id,
        readmodelKnodiaApiKeychain.metadataVersion,
      ],
      name: "knodia_api_keychain_key_knodia_api_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.knodiaApiKeychainId, table.kid],
      name: "knodia_api_keychain_key_pkey",
    }),
  ],
);

export interface FlatKnodiaApiKeychainItemsSQL {
  knodiaApiKeychainSQL: KnodiaApiKeychainSQL;
}

export interface KnodiaApiKeychainItemsSQL {
  knodiaApiKeychainKeysSQL: KnodiaApiKeychainKeySQL[];
  knodiaApiKeychainSQL: KnodiaApiKeychainSQL;
  knodiaApiKeychainUsersSQL: KnodiaApiKeychainUserSQL[];
}
export type KnodiaApiKeychainKeySQL = InferSelectModel<
  typeof readmodelKnodiaApiKeychainKey
>;
export type KnodiaApiKeychainSQL = InferSelectModel<
  typeof readmodelKnodiaApiKeychain
>;

export type KnodiaApiKeychainUserSQL = InferSelectModel<
  typeof readmodelKnodiaApiKeychainUser
>;

export type NewReadmodelKnodiaApiKeychain =
  typeof readmodelKnodiaApiKeychain.$inferInsert;
export type NewReadmodelKnodiaApiKeychainKey =
  typeof readmodelKnodiaApiKeychainKey.$inferInsert;
export type NewReadmodelKnodiaApiKeychainUser =
  typeof readmodelKnodiaApiKeychainUser.$inferInsert;

export type ReadmodelKnodiaApiKeychain =
  typeof readmodelKnodiaApiKeychain.$inferSelect;
export type ReadmodelKnodiaApiKeychainKey =
  typeof readmodelKnodiaApiKeychainKey.$inferSelect;
export type ReadmodelKnodiaApiKeychainUser =
  typeof readmodelKnodiaApiKeychainUser.$inferSelect;

export const knodiaApiKeychainSubTables = [
  readmodelKnodiaApiKeychainUser,
  readmodelKnodiaApiKeychainKey,
];
export const knodiaApiKeychainTables = [
  ...knodiaApiKeychainSubTables,
  readmodelKnodiaApiKeychain,
];
