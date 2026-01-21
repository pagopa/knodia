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

export async function setupReadmodelTestContainer() {
  return await startTestPostgresContainer({
    dbPassword: READMODEL_DB_PASSWORD,
    dbUser: READMODEL_DB_USER,
  });
}

export async function setupReadmodelTestDatabase() {
  const { container, port } = await setupReadmodelTestContainer();

  const randomId = crypto.randomUUID();
  const dbName = `test_readmodel_db_worker_${randomId}`;

  await container.exec([
    "psql",
    "-U",
    READMODEL_DB_USER,
    "-d",
    "postgres",
    "-c",
    `CREATE DATABASE "${dbName}";`,
  ]);

  const connectionString = `postgresql://${READMODEL_DB_USER}:${READMODEL_DB_PASSWORD}@${container.getHost()}:${port}/${dbName}`;

  const db = drizzle(connectionString);
  await applyReadmodelMigrations(db);
  await db.$client.end();

  return connectionString;
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
