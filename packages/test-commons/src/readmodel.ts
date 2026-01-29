import type {} from "vitest";

import { drizzle } from "drizzle-orm/node-postgres";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";

import { startTestPostgresContainer } from "./testcontainers/postgres.ts";

const READMODEL_DB_PASSWORD = "readmodel_testpassword";
const READMODEL_DB_USER = "readmodel_testuser";
const READMODEL_DB_TEMPLATE_NAME = "readmodel_template";

/**
 * Truncates readmodel data to keep tests isolated across runs.
 * Should be called after each test.
 */
export async function cleanupReadmodelTestDatabase(db: NodePgDatabase) {
  await db.execute('TRUNCATE TABLE "eservice"."eservice" CASCADE');
}

/**
 * !!! Intended to be called once in global test setup !!!
 *
 *  Starts the shared Postgres test container and prepares a template database.
 *  It creates the readmodel template, applies migrations once, and marks it as a Postgres template.
 */
export async function setupReadmodelTestContainer() {
  const startedContainer = await startTestPostgresContainer({
    dbPassword: READMODEL_DB_PASSWORD,
    dbUser: READMODEL_DB_USER,
  });

  const adminDb = drizzle(startedContainer.connectionString + `/postgres`);

  try {
    await adminDb.execute(`CREATE DATABASE "${READMODEL_DB_TEMPLATE_NAME}"`);

    const templateDb = drizzle(
      startedContainer.connectionString + `/${READMODEL_DB_TEMPLATE_NAME}`,
    );

    try {
      await applyReadmodelMigrations(templateDb);
    } finally {
      await templateDb.$client.end();
    }

    await adminDb.execute(
      `ALTER DATABASE "${READMODEL_DB_TEMPLATE_NAME}" IS_TEMPLATE true`,
    );
  } finally {
    await adminDb.$client.end();
  }

  return startedContainer;
}

/**
 * Creates a dedicated database for a single test file by cloning the template.
 * It generates a unique DB name, creates it using TEMPLATE, and returns a Drizzle connection.
 *
 * Intended to be called in beforeAll of each test file.
 */
export async function setupReadmodelTestDatabase(connectionString: string) {
  const randomId = crypto.randomUUID();
  const dbName = `test_readmodel_db_worker_${randomId}`;

  const adminDb = drizzle(connectionString + `/postgres`);

  try {
    await adminDb.execute(
      `CREATE DATABASE "${dbName}" TEMPLATE "${READMODEL_DB_TEMPLATE_NAME}"`,
    );
  } finally {
    await adminDb.$client.end();
  }

  return drizzle(connectionString + `/${dbName}`);
}

async function applyReadmodelMigrations(db: NodePgDatabase) {
  const getMigrationPath = (entity: string) =>
    fileURLToPath(
      new URL(`../../db/readmodel/${entity}/drizzle`, import.meta.url),
    );

  const migrations = [getMigrationPath("eservice")];

  for (const migration of migrations) {
    await migrate(db, {
      migrationsFolder: migration,
    });
  }
}

declare module "vitest" {
  export interface ProvidedContext {
    READMODEL_CONNECTION_STRING: string;
  }
}
