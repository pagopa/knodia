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

export const readmodelProducerKeychain = keychainSchema.table(
  "producer_keychain",
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
    unique("producer_keychain_id_metadata_v_unique").on(
      table.metadataVersion,
      table.id,
    ),
  ],
);

export const readmodelProducerKeychainUser = keychainSchema.table(
  "producer_keychain_user",
  {
    addedAt: timestamp("added_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    producerKeychainId: uuid("producer_keychain_id").notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.producerKeychainId],
      foreignColumns: [readmodelProducerKeychain.id],
      name: "producer_keychain_user_producer_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.producerKeychainId, table.metadataVersion],
      foreignColumns: [
        readmodelProducerKeychain.id,
        readmodelProducerKeychain.metadataVersion,
      ],
      name: "producer_keychain_user_producer_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.producerKeychainId, table.metadataVersion, table.userId],
      name: "producer_keychain_user_pk",
    }),
  ],
);

export const readmodelProducerKeychainEservice = keychainSchema.table(
  "producer_keychain_eservice",
  {
    eserviceId: uuid("eservice_id").notNull(),
    linkedAt: timestamp("linked_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    producerKeychainId: uuid("producer_keychain_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.producerKeychainId],
      foreignColumns: [readmodelProducerKeychain.id],
      name: "producer_keychain_eservice_producer_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.metadataVersion, table.producerKeychainId],
      foreignColumns: [
        readmodelProducerKeychain.id,
        readmodelProducerKeychain.metadataVersion,
      ],
      name: "producer_keychain_eservice_producer_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [
        table.eserviceId,
        table.metadataVersion,
        table.producerKeychainId,
      ],
      name: "producer_keychain_eservice_pk",
    }),
  ],
);

export const readmodelProducerKeychainKey = keychainSchema.table(
  "producer_keychain_key",
  {
    algorithm: text().notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    encodedPem: text("encoded_pem").notNull(),
    format: text().notNull(),
    kid: text().notNull(),
    metadataVersion: bigint("metadata_version", { mode: "number" }).notNull(),
    name: jsonb().notNull(),
    producerKeychainId: uuid("producer_keychain_id").notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.producerKeychainId],
      foreignColumns: [readmodelProducerKeychain.id],
      name: "producer_keychain_key_producer_keychain_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.producerKeychainId, table.metadataVersion],
      foreignColumns: [
        readmodelProducerKeychain.id,
        readmodelProducerKeychain.metadataVersion,
      ],
      name: "producer_keychain_key_producer_keychain_id_metadata_v_fkey",
    }),
    primaryKey({
      columns: [table.producerKeychainId, table.kid],
      name: "producer_keychain_key_pkey",
    }),
  ],
);

export interface FlatProducerKeychainItemsSQL {
  producerKeychainSQL: ProducerKeychainSQL;
}

export type NewReadmodelProducerKeychain =
  typeof readmodelProducerKeychain.$inferInsert;
export type NewReadmodelProducerKeychainEservice =
  typeof readmodelProducerKeychainEservice.$inferInsert;
export type NewReadmodelProducerKeychainKey =
  typeof readmodelProducerKeychainKey.$inferInsert;
export type NewReadmodelProducerKeychainUser =
  typeof readmodelProducerKeychainUser.$inferInsert;

export type ProducerKeychainEserviceSQL = InferSelectModel<
  typeof readmodelProducerKeychainEservice
>;

export interface ProducerKeychainItemsSQL {
  producerKeychainKeysSQL: ProducerKeychainKeySQL[];
  producerKeychainSQL: ProducerKeychainSQL;
  producerKeychainUsersSQL: ProducerKeychainUserSQL[];
}
export type ProducerKeychainKeySQL = InferSelectModel<
  typeof readmodelProducerKeychainKey
>;
export type ProducerKeychainSQL = InferSelectModel<
  typeof readmodelProducerKeychain
>;
export type ProducerKeychainUserSQL = InferSelectModel<
  typeof readmodelProducerKeychainUser
>;

export type ReadmodelProducerKeychain =
  typeof readmodelProducerKeychain.$inferSelect;
export type ReadmodelProducerKeychainEservice =
  typeof readmodelProducerKeychainEservice.$inferSelect;
export type ReadmodelProducerKeychainKey =
  typeof readmodelProducerKeychainKey.$inferSelect;
export type ReadmodelProducerKeychainUser =
  typeof readmodelProducerKeychainUser.$inferSelect;

export const producerKeychainSubTables = [
  readmodelProducerKeychainUser,
  readmodelProducerKeychainKey,
];
export const producerKeychainTables = [
  ...producerKeychainSubTables,
  readmodelProducerKeychainEservice,
  readmodelProducerKeychain,
];
