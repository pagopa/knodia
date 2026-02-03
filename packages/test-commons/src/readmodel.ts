import type {} from "vitest";

import { drizzle } from "drizzle-orm/node-postgres";
import { fileURLToPath } from "node:url";

import {
  createPostgresDatabaseFromTemplate,
  createPostgresTemplateFromMigrations,
  startTestPostgresContainer,
} from "./testcontainers/postgres.ts";

const READMODEL_DB_PASSWORD = "readmodel_testpassword";
const READMODEL_DB_USER = "readmodel_testuser";
const READMODEL_DB_TEMPLATE_NAME = "readmodel_template";

/**
 * !!! Intended to be called once in global test setup !!!
 *
 *  Starts the shared Postgres test container and prepares a template database.
 *  It creates the readmodel template, applies migrations once, and marks it as a Postgres template.
 */
export async function setupReadmodelTestContainer() {
  const startedContainer = await startTestPostgresContainer({
    password: READMODEL_DB_PASSWORD,
    testContainerName: "knodia-readmodel-test-container",
    user: READMODEL_DB_USER,
  });

  await createPostgresTemplateFromMigrations({
    connectionString: startedContainer.connectionString,
    migrationFolders: [
      fileURLToPath(
        new URL(`../../db/readmodel/eservice/drizzle`, import.meta.url),
      ),
    ],
    templateName: READMODEL_DB_TEMPLATE_NAME,
  });

  return startedContainer;
}

/**
 * Creates a dedicated database for a single test file by cloning the template.
 * It generates a unique DB name, creates it using TEMPLATE, and returns a Drizzle connection.
 *
 * Intended to be called in beforeAll of each test file.
 * @beta
 */
export async function setupReadmodelTestDatabase(connectionString: string) {
  const randomId = crypto.randomUUID();
  const dbName = `test_readmodel_db_worker_${randomId}`;

  await createPostgresDatabaseFromTemplate(
    connectionString,
    READMODEL_DB_TEMPLATE_NAME,
    dbName,
  );

  return drizzle(connectionString + `/${dbName}`);
}

declare module "vitest" {
  export interface ProvidedContext {
    READMODEL_CONNECTION_STRING: string;
  }
}
