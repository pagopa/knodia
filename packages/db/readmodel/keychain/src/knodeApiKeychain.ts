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

import { keychainSchema } from "./keychainSchema.ts";

export const readmodelKnodeApiKeychain = keychainSchema.table(
  "knode_api_keychain",
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
    unique("knode_api_keychain_id_metadata_v_unique").on(
      table.metadataVersion,
      table.id,
    ),
  ],
);

export const readmodelKnodeApiKeychainUser = keychainSchema.table(
  "knode_api_keychain_user",
  {
    addedAt: timestamp("added_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    knodeApiKeychainId: uuid("knode_api_keychain_id").notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.knodeApiKeychainId],
      foreignColumns: [readmodelKnodeApiKeychain.id],
      name: "knode_api_keychain_user_knode_api_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.knodeApiKeychainId, table.metadataVersion],
      foreignColumns: [
        readmodelKnodeApiKeychain.id,
        readmodelKnodeApiKeychain.metadataVersion,
      ],
      name: "knode_api_keychain_user_knode_api_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.userId, table.metadataVersion, table.knodeApiKeychainId],
      name: "knode_api_keychain_user_pk",
    }),
  ],
);

export const readmodelKnodeApiKeychainKey = keychainSchema.table(
  "knode_api_keychain_key",
  {
    algorithm: text().notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    encodedPem: text("encoded_pem").notNull(),
    format: text().notNull(),
    kid: text().notNull(),
    knodeApiKeychainId: uuid("knode_api_keychain_id").notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: jsonb().notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.knodeApiKeychainId],
      foreignColumns: [readmodelKnodeApiKeychain.id],
      name: "knode_api_keychain_key_knode_api_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.knodeApiKeychainId, table.metadataVersion],
      foreignColumns: [
        readmodelKnodeApiKeychain.id,
        readmodelKnodeApiKeychain.metadataVersion,
      ],
      name: "knode_api_keychain_key_knode_api_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.knodeApiKeychainId, table.kid],
      name: "knode_api_keychain_key_pkey",
    }),
  ],
);

export interface FlatKnodeApiKeychainItemsSQL {
  knodeApiKeychainSQL: KnodeApiKeychainSQL;
}

export interface KnodeApiKeychainItemsSQL {
  knodeApiKeychainKeysSQL: KnodeApiKeychainKeySQL[];
  knodeApiKeychainSQL: KnodeApiKeychainSQL;
  knodeApiKeychainUsersSQL: KnodeApiKeychainUserSQL[];
}
export type KnodeApiKeychainKeySQL = InferSelectModel<
  typeof readmodelKnodeApiKeychainKey
>;
export type KnodeApiKeychainSQL = InferSelectModel<
  typeof readmodelKnodeApiKeychain
>;

export type KnodeApiKeychainUserSQL = InferSelectModel<
  typeof readmodelKnodeApiKeychainUser
>;

export type NewReadmodelKnodeApiKeychain =
  typeof readmodelKnodeApiKeychain.$inferInsert;
export type NewReadmodelKnodeApiKeychainKey =
  typeof readmodelKnodeApiKeychainKey.$inferInsert;
export type NewReadmodelKnodeApiKeychainUser =
  typeof readmodelKnodeApiKeychainUser.$inferInsert;

export type ReadmodelKnodeApiKeychain =
  typeof readmodelKnodeApiKeychain.$inferSelect;
export type ReadmodelKnodeApiKeychainKey =
  typeof readmodelKnodeApiKeychainKey.$inferSelect;
export type ReadmodelKnodeApiKeychainUser =
  typeof readmodelKnodeApiKeychainUser.$inferSelect;

export const knodeApiKeychainSubTables = [
  readmodelKnodeApiKeychainUser,
  readmodelKnodeApiKeychainKey,
];
export const knodeApiKeychainTables = [
  ...knodeApiKeychainSubTables,
  readmodelKnodeApiKeychain,
];
