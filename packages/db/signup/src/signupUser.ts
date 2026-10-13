import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  integer,
  pgSchema,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { signupDbConfig } from "./config.ts";

const schema = pgSchema(signupDbConfig.signupDbSchema);

// Postgres treats NULL as distinct in UNIQUE constraints, so users without a
// given IdP identifier coexist; the CHECK below requires exactly one set.
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
    signupUserId: uuid("signup_user_id").primaryKey(),
    spidCode: text("spid_code").unique(),
    status: text("status").notNull(),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    suspensionReason: text("suspension_reason"),
    termsAcceptedAt: timestamp("terms_accepted_at", {
      withTimezone: true,
    }).notNull(),
    termsAcceptedVersion: integer("terms_accepted_version").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      "signup_user_single_identifier",
      sql`(${table.spidCode} IS NOT NULL)::int + (${table.fiscalNumber} IS NOT NULL)::int = 1`,
    ),
    check(
      "signup_user_status_valid",
      sql`${table.status} IN ('OnboardingPending', 'Active', 'Suspended', 'DeletionPending')`,
    ),
    check(
      "signup_user_suspension_consistency",
      sql`(${table.status} = 'Suspended' AND ${table.suspendedAt} IS NOT NULL AND ${table.suspensionReason} IS NOT NULL) OR (${table.status} <> 'Suspended' AND ${table.suspendedAt} IS NULL AND ${table.suspensionReason} IS NULL)`,
    ),
    check(
      "signup_user_terms_accepted_version_positive",
      sql`${table.termsAcceptedVersion} > 0`,
    ),
  ],
);

export const emailChangeRequest = schema.table(
  "email_change_request",
  {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    email: text("email").notNull().unique(),
    emailChangeRequestId: uuid("email_change_request_id").primaryKey(),
    signupUserId: uuid("signup_user_id").notNull().unique(),
  },
  (table) => [
    foreignKey({
      columns: [table.signupUserId],
      foreignColumns: [signupUser.signupUserId],
      name: "email_change_request_signup_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

export type EmailChangeRequestSQL = typeof emailChangeRequest.$inferSelect;
export type NewEmailChangeRequest = typeof emailChangeRequest.$inferInsert;
export type NewSignupUser = typeof signupUser.$inferInsert;
export type SignupUserSQL = typeof signupUser.$inferSelect;

// Completed deletions: the signup_user row is hard-deleted and only its id
// plus the erasure timestamp survive here, so the deletion act stays provable
// (idempotent replays, late-event skips) without retaining any PII.
export const deletedSignupUser = schema.table("deleted_signup_user", {
  deletedAt: timestamp("deleted_at", { withTimezone: true }).notNull(),
  signupUserId: uuid("signup_user_id").primaryKey(),
});

export type DeletedSignupUserSQL = typeof deletedSignupUser.$inferSelect;
export type NewDeletedSignupUser = typeof deletedSignupUser.$inferInsert;
