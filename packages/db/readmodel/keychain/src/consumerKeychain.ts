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

export const readmodelConsumerKeychain = keychainSchema.table(
  "consumer_keychain",
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
    unique("consumer_keychain_id_metadata_v_unique").on(
      table.metadataVersion,
      table.id,
    ),
  ],
);

export const readmodelConsumerKeychainUser = keychainSchema.table(
  "consumer_keychain_user",
  {
    consumerKeychainId: uuid("consumer_keychain_id").notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.consumerKeychainId],
      foreignColumns: [readmodelConsumerKeychain.id],
      name: "consumer_keychain_user_consumer_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.consumerKeychainId, table.metadataVersion],
      foreignColumns: [
        readmodelConsumerKeychain.id,
        readmodelConsumerKeychain.metadataVersion,
      ],
      name: "consumer_keychain_user_consumer_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.userId, table.metadataVersion, table.consumerKeychainId],
      name: "consumer_keychain_user_pk",
    }),
  ],
);

export const readmodelConsumerKeychainPurpose = keychainSchema.table(
  "consumer_keychain_purpose",
  {
    consumerKeychainId: uuid("consumer_keychain_id").notNull(),
    linkedAt: timestamp("linked_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    producerKnodeId: text("producer_knode_id").notNull(),
    purposeId: uuid("purpose_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.consumerKeychainId],
      foreignColumns: [readmodelConsumerKeychain.id],
      name: "consumer_keychain_purpose_consumer_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.consumerKeychainId, table.metadataVersion],
      foreignColumns: [
        readmodelConsumerKeychain.id,
        readmodelConsumerKeychain.metadataVersion,
      ],
      name: "consumer_keychain_purpose_consumer_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [
        table.purposeId,
        table.metadataVersion,
        table.consumerKeychainId,
      ],
      name: "consumer_keychain_purpose_pk",
    }),
  ],
);

export const readmodelConsumerKeychainKey = keychainSchema.table(
  "consumer_keychain_key",
  {
    algorithm: text().notNull(),
    consumerKeychainId: uuid("consumer_keychain_id").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    encodedPem: text("encoded_pem").notNull(),
    format: text().notNull(),
    kid: text().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: jsonb().notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.consumerKeychainId],
      foreignColumns: [readmodelConsumerKeychain.id],
      name: "consumer_keychain_key_consumer_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.consumerKeychainId, table.metadataVersion],
      foreignColumns: [
        readmodelConsumerKeychain.id,
        readmodelConsumerKeychain.metadataVersion,
      ],
      name: "consumer_keychain_key_consumer_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.consumerKeychainId, table.kid],
      name: "consumer_keychain_key_pkey",
    }),
  ],
);

export interface ConsumerKeychainItemsSQL {
  consumerKeychainKeysSQL: ConsumerKeychainKeySQL[];
  consumerKeychainSQL: ConsumerKeychainSQL;
  consumerKeychainUsersSQL: ConsumerKeychainUserSQL[];
}

export type ConsumerKeychainKeySQL = InferSelectModel<
  typeof readmodelConsumerKeychainKey
>;
export type ConsumerKeychainPurposeSQL = InferSelectModel<
  typeof readmodelConsumerKeychainPurpose
>;
export type ConsumerKeychainSQL = InferSelectModel<
  typeof readmodelConsumerKeychain
>;
export type ConsumerKeychainUserSQL = InferSelectModel<
  typeof readmodelConsumerKeychainUser
>;

export interface FlatConsumerKeychainItemsSQL {
  consumerKeychainSQL: ConsumerKeychainSQL;
}

export type NewReadmodelConsumerKeychain =
  typeof readmodelConsumerKeychain.$inferInsert;
export type NewReadmodelConsumerKeychainKey =
  typeof readmodelConsumerKeychainKey.$inferInsert;
export type NewReadmodelConsumerKeychainPurpose =
  typeof readmodelConsumerKeychainPurpose.$inferInsert;
export type NewReadmodelConsumerKeychainUser =
  typeof readmodelConsumerKeychainUser.$inferInsert;

export type ReadmodelConsumerKeychain =
  typeof readmodelConsumerKeychain.$inferSelect;
export type ReadmodelConsumerKeychainKey =
  typeof readmodelConsumerKeychainKey.$inferSelect;
export type ReadmodelConsumerKeychainPurpose =
  typeof readmodelConsumerKeychainPurpose.$inferSelect;
export type ReadmodelConsumerKeychainUser =
  typeof readmodelConsumerKeychainUser.$inferSelect;

export const consumerKeychainSubTables = [
  readmodelConsumerKeychainUser,
  readmodelConsumerKeychainKey,
];
export const consumerKeychainTables = [
  ...consumerKeychainSubTables,
  readmodelConsumerKeychainPurpose,
  readmodelConsumerKeychain,
];
