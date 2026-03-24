import { pgSchema, primaryKey, text, uuid } from "drizzle-orm/pg-core";

import { remoteResourceDbConfig } from "./config.ts";

const purposeSchema = pgSchema(
  remoteResourceDbConfig.remoteResourceDbPurposeSchema,
);

export const remoteResourcePurpose = purposeSchema.table(
  "purpose",
  {
    consumerId: uuid("consumer_id").notNull(),
    eserviceId: uuid("eservice_id").notNull(),
    knodeId: text("knode_id").notNull(),
    purposeId: uuid("purpose_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.knodeId, table.purposeId],
      name: "purpose_pk",
    }),
  ],
);

export type NewRemoteResourcePurpose =
  typeof remoteResourcePurpose.$inferInsert;

export type RemoteResourcePurposeSQL =
  typeof remoteResourcePurpose.$inferSelect;
