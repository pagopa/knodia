import { drizzle } from "drizzle-orm/node-postgres";
import { fileURLToPath } from "node:url";

import { createPostgresDatabaseFromTemplate } from "./testcontainers/postgres.ts";

const SIGNAL_HUB_DB_TEMPLATE_NAME = "signal_hub_template";

export const signalHubDbTemplate = {
  migrationsRoot: fileURLToPath(
    new URL(`../../../migration/signal-hub`, import.meta.url),
  ),
  templateName: SIGNAL_HUB_DB_TEMPLATE_NAME,
};

/**
 * Creates a dedicated database for a single test file by cloning the template.
 * It generates a unique DB name, creates it using TEMPLATE, and returns a Drizzle connection.
 *
 * Intended to be called in beforeAll of each test file.
 * @beta
 */
export async function setupSignalHubTestDatabase(connectionString: string) {
  const randomId = crypto.randomUUID();
  const dbName = `test_signal_hub_db_worker_${randomId}`;

  await createPostgresDatabaseFromTemplate(
    connectionString,
    SIGNAL_HUB_DB_TEMPLATE_NAME,
    dbName,
  );

  return drizzle(connectionString + `/${dbName}`);
}
