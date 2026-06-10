import { drizzle } from "drizzle-orm/node-postgres";
import { fileURLToPath } from "node:url";

import { createPostgresDatabaseFromTemplate } from "./testcontainers/postgres.ts";

const SIGNUP_DB_TEMPLATE_NAME = "signup_template";

export const signupDbTemplate = {
  migrationsRoot: fileURLToPath(
    new URL(`../../../migration/signup`, import.meta.url),
  ),
  templateName: SIGNUP_DB_TEMPLATE_NAME,
};

/**
 * Creates a dedicated database for a single test file by cloning the template.
 * It generates a unique DB name, creates it using TEMPLATE, and returns a Drizzle connection.
 *
 * Intended to be called in beforeAll of each test file.
 * @beta
 */
export async function setupSignupTestDatabase(connectionString: string) {
  const randomId = crypto.randomUUID();
  const dbName = `test_signup_db_worker_${randomId}`;

  await createPostgresDatabaseFromTemplate(
    connectionString,
    SIGNUP_DB_TEMPLATE_NAME,
    dbName,
  );

  return drizzle(connectionString + `/${dbName}`);
}
