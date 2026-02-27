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

import { readmodelConsumerKeychainConfig } from "../config/config.ts";

export const consumerKeychainSchema = pgSchema(
  readmodelConsumerKeychainConfig.readmodelDbConsumerKeychainSchema,
);

export const readmodelConsumerKeychain = consumerKeychainSchema.table(
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

export const readmodelConsumerKeychainUser = consumerKeychainSchema.table(
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

export const readmodelConsumerKeychainPurpose = consumerKeychainSchema.table(
  "consumer_keychain_purpose",
  {
    consumerKeychainId: uuid("consumer_keychain_id").notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
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

export const readmodelConsumerKeychainKey = consumerKeychainSchema.table(
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
    use: text().notNull(),
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
  consumerKeychainPurposesSQL: ConsumerKeychainPurposeSQL[];
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
