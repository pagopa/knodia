import { drizzle } from "drizzle-orm/node-postgres";
import { fileURLToPath } from "node:url";

import { createPostgresDatabaseFromTemplate } from "./testcontainers/postgres.ts";

const EVENTSTORE_DB_TEMPLATE_NAME = "eventstore_template";

export const eventstoreTemplate = {
  migrationsRoot: fileURLToPath(
    new URL(`../../../migration/event-store`, import.meta.url),
  ),
  templateName: EVENTSTORE_DB_TEMPLATE_NAME,
};

/**
 * Creates a dedicated database for a single test file by cloning the template.
 * It generates a unique DB name, creates it using TEMPLATE, and returns a Drizzle connection.
 *
 * Intended to be called in beforeAll of each test file.
 */
export async function setupEventstoreTestDatabase(connectionString: string) {
  const randomId = crypto.randomUUID();
  const dbName = `test_eventstore_db_worker_${randomId}`;

  await createPostgresDatabaseFromTemplate(
    connectionString,
    EVENTSTORE_DB_TEMPLATE_NAME,
    dbName,
  );

  return drizzle(connectionString + `/${dbName}`);
}
