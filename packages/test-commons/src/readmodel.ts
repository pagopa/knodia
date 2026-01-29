import type {} from "vitest";

import { drizzle } from "drizzle-orm/node-postgres";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";

import { startTestPostgresContainer } from "./testcontainers/postgres.ts";

const READMODEL_DB_PASSWORD = "readmodel_testpassword";
const READMODEL_DB_USER = "readmodel_testuser";

export async function cleanupReadmodelTestDatabase(db: NodePgDatabase) {
  await db.execute("TRUNCATE TABLE eservice CASCADE");
}

export function destroyReadmodelTestDatabase(connectionString: string) {
  return async () => {
    const dbName = connectionString.split("/").pop() as string;

    const adminDb = drizzle(
      connectionString.replace(`/${dbName}`, `/postgres`),
    );

    try {
      // Terminate all connections to the database
      await adminDb.execute(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${dbName}'
          AND pid <> pg_backend_pid();
      `);

      // Drop the database
      await adminDb.execute(`DROP DATABASE IF EXISTS "${dbName}"`);
    } finally {
      await adminDb.$client.end();
    }
  };
}

export async function setupReadmodelTestContainer() {
  return await startTestPostgresContainer({
    dbPassword: READMODEL_DB_PASSWORD,
    dbUser: READMODEL_DB_USER,
  });
}

export async function setupReadmodelTestDatabase(connectionString: string) {
  const randomId = crypto.randomUUID();
  const dbName = `test_readmodel_db_worker_${randomId}`;

  const adminDb = drizzle(connectionString + `/postgres`);

  try {
    await adminDb.execute(`CREATE DATABASE "${dbName}"`);
  } finally {
    await adminDb.$client.end();
  }

  const dbConnectionString = connectionString + `/${dbName}`;

  const db = drizzle(dbConnectionString);

  try {
    await applyReadmodelMigrations(db);
  } finally {
    await db.$client.end();
  }

  return dbConnectionString;
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
