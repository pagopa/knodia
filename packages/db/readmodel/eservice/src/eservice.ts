import { pgSchema, uuid } from "drizzle-orm/pg-core";

import { readModelEserviceConfig } from "../config/config.ts";

export const eserviceSchema = pgSchema(
  readModelEserviceConfig.readModelDbEserviceSchema,
);

export const readmodelEservice = eserviceSchema.table("eservice", {
  id: uuid().primaryKey(),
});

export type NewReadmodelEservice = typeof readmodelEservice.$inferInsert;
export type ReadmodelEservice = typeof readmodelEservice.$inferSelect;
