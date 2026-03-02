import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { resourceManagerDbConfig } from "../config/resourceManagerDbConfig.ts";

const agreementSchema = pgSchema(
  resourceManagerDbConfig.resourceManagerDbAgreementSchema,
);

export const remoteResourceAgreement = agreementSchema.table(
  "remote_resource",
  {
    agreementId: uuid("agreement_id").notNull(),
    id: uuid().primaryKey().notNull(),
    knodeId: text("knode_id").notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
);
