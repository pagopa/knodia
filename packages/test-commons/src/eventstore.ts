import type {} from "vitest";

import { drizzle } from "drizzle-orm/node-postgres";
import { fileURLToPath } from "node:url";

import {
  createPostgresDatabaseFromTemplate,
  createPostgresTemplateFromMigrations,
  startTestPostgresContainer,
} from "./testcontainers/postgres.ts";

const EVENTSTORE_DB_PASSWORD = "eventstore_testpassword";
const EVENTSTORE_DB_USER = "eventstore_testuser";
const EVENTSTORE_DB_TEMPLATE_NAME = "eventstore_template";

/**
 * !!! Intended to be called once in global test setup !!!
 *
 *  Starts the shared Postgres test container and prepares a template database.
 *  It creates the eventstore template, applies migrations once, and marks it as a Postgres template.
 */
export async function setupEventstoreTestContainer() {
  const startedContainer = await startTestPostgresContainer({
    password: EVENTSTORE_DB_PASSWORD,
    testContainerName: "knodia-event-store-test-container",
    user: EVENTSTORE_DB_USER,
  });

  await createPostgresTemplateFromMigrations({
    connectionString: startedContainer.connectionString,
    migrationsRoot: fileURLToPath(
      new URL(`../../../migration/event-store`, import.meta.url),
    ),
    rolesMigrationFolder: fileURLToPath(
      new URL(`../../../migration/roles`, import.meta.url),
    ),
    templateName: EVENTSTORE_DB_TEMPLATE_NAME,
  });

  return startedContainer;
}

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

declare module "vitest" {
  export interface ProvidedContext {
    EVENTSTORE_CONNECTION_STRING: string;
  }
}
