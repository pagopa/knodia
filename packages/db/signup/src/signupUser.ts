import { sql } from "drizzle-orm";
import {
  check,
  date,
  pgSchema,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { signupDbConfig } from "./config.ts";

const schema = pgSchema(signupDbConfig.signupDbSchema);

// Postgres treats NULL as distinct in UNIQUE constraints, so users without a
// given IdP identifier coexist; the CHECK below requires at least one set.
/** @knipignore */
export const signupUser = schema.table(
  "signup_user",
  {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    email: text("email").notNull().unique(),
    familyName: text("family_name").notNull(),
    fiscalNumber: text("fiscal_number").unique(),
    lynxOrganizationName: text("lynx_organization_name").notNull().unique(),
    lynxUserName: text("lynx_user_name").notNull().unique(),
    name: text("name").notNull(),
    orionOrganizationName: text("orion_organization_name").notNull().unique(),
    orionUserName: text("orion_user_name").notNull().unique(),
    personIdentifier: text("person_identifier").unique(),
    signupUserId: uuid("signup_user_id").primaryKey(),
    spidCode: text("spid_code").unique(),
    status: text("status").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "signup_user_at_least_one_identifier",
      sql`${table.spidCode} IS NOT NULL OR ${table.fiscalNumber} IS NOT NULL OR ${table.personIdentifier} IS NOT NULL`,
    ),
  ],
);

/** @knipignore */
export type NewSignupUser = typeof signupUser.$inferInsert;
/** @knipignore */
export type SignupUserSQL = typeof signupUser.$inferSelect;
