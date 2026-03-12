import { drizzle } from "drizzle-orm/node-postgres";
import { fileURLToPath } from "node:url";

import { createPostgresDatabaseFromTemplate } from "./testcontainers/postgres.ts";

const REMOTE_RESOURCE_DB_TEMPLATE_NAME = "remote_resource_template";

export const remoteResourceDbTemplate = {
  migrationsRoot: fileURLToPath(
    new URL(`../../../migration/remote-resource`, import.meta.url),
  ),
  templateName: REMOTE_RESOURCE_DB_TEMPLATE_NAME,
};

/**
 * Creates a dedicated database for a single test file by cloning the template.
 * It generates a unique DB name, creates it using TEMPLATE, and returns a Drizzle connection.
 *
 * Intended to be called in beforeAll of each test file.
 * @beta
 */
export async function setupRemoteResourceTestDatabase(
  connectionString: string,
) {
  const randomId = crypto.randomUUID();
  const dbName = `test_remote_resource_db_worker_${randomId}`;

  await createPostgresDatabaseFromTemplate(
    connectionString,
    REMOTE_RESOURCE_DB_TEMPLATE_NAME,
    dbName,
  );

  return drizzle(connectionString + `/${dbName}`);
}
