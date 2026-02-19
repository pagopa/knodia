import type {} from "vitest";

import { drizzle } from "drizzle-orm/node-postgres";
import { fileURLToPath } from "node:url";

import {
  createPostgresDatabaseFromTemplate,
  createPostgresTemplateFromMigrations,
} from "./testcontainers/postgres.ts";

const READMODEL_DB_TEMPLATE_NAME = "readmodel_template";

/**
 * !!! Intended to be called once in global test setup !!!
 *
 *  Prepares the readmodel template database.
 *  It applies migrations once and marks it as a Postgres template.
 */
export async function setupReadmodelTemplate(connectionString: string) {
  await createPostgresTemplateFromMigrations({
    connectionString,
    migrationsRoot: fileURLToPath(
      new URL(`../../../migration/read-model`, import.meta.url),
    ),
    rolesMigrationFolder: fileURLToPath(
      new URL(`../../../migration/roles`, import.meta.url),
    ),
    templateName: READMODEL_DB_TEMPLATE_NAME,
  });
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
    POSTGRES_CONNECTION_STRING: string;
  }
}
