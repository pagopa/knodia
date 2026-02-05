import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GenericContainer } from "testcontainers";

const TEST_POSTGRES_DB_PORT = 5432;
const TEST_POSTGRES_IMAGE = "postgres:18";
const TEST_NAMESPACE = "test";

export async function createPostgresDatabaseFromTemplate(
  connectionString: string,
  templateName: string,
  dbName: string,
) {
  await withAdminDb(connectionString, async (adminDb) => {
    await adminDb.execute(
      `CREATE DATABASE "${dbName}" TEMPLATE "${templateName}"`,
    );
  });
}

export async function createPostgresTemplateFromMigrations({
  connectionString,
  migrationFolders,
  templateName,
}: {
  connectionString: string;
  migrationFolders: string[];
  templateName: string;
}) {
  await withAdminDb(connectionString, async (adminDb) => {
    const existsResult = await adminDb.execute(
      `SELECT 1 FROM pg_database WHERE datname = '${templateName}'`,
    );

    const rows = existsResult.rows;
    const templateExists = Array.isArray(rows) && rows.length > 0;

    if (templateExists) {
      return;
    }

    await adminDb.execute(`CREATE DATABASE "${templateName}"`);

    const templateDb = drizzle(connectionString + `/${templateName}`);

    try {
      await applyMigrations(migrationFolders, templateDb);
    } finally {
      await templateDb.$client.end();
    }

    await adminDb.execute(`ALTER DATABASE "${templateName}" IS_TEMPLATE true`);
  });
}

export async function startTestPostgresContainer({
  password,
  testContainerName,
  user,
}: {
  password: string;
  testContainerName: string;
  user: string;
}) {
  const container = await new GenericContainer(TEST_POSTGRES_IMAGE)
    .withName(testContainerName)
    .withExposedPorts(TEST_POSTGRES_DB_PORT)
    .withReuse()
    .withEnvironment({
      POSTGRES_PASSWORD: password,
      POSTGRES_USER: user,
    })
    .start();

  const port = container.getMappedPort(TEST_POSTGRES_DB_PORT);
  const host = container.getHost();
  const connectionString = `postgresql://${user}:${password}@${host}:${port}`;

  return {
    connectionString,
    container,
  };
}

/**
 * Applies SQL migrations from Flyway-style migration folders.
 * Reads .sql files, replaces ${namespace} placeholder, and executes them.
 * Flyway convention: V* (versioned) files run before R* (repeatable) files.
 */
async function applyMigrations(migrationFolders: string[], db: NodePgDatabase) {
  for (const folder of migrationFolders) {
    const files = readdirSync(folder).filter((f) => f.endsWith(".sql"));

    // Flyway order: V* (versioned) first, then R* (repeatable)
    const versionedFiles = files.filter((f) => f.startsWith("V")).sort();
    const repeatableFiles = files.filter((f) => f.startsWith("R")).sort();
    const orderedFiles = [...versionedFiles, ...repeatableFiles];

    for (const file of orderedFiles) {
      const filePath = join(folder, file);
      let sql = readFileSync(filePath, "utf-8");

      // Replace Flyway placeholders with test values
      sql = sql.replace(/\$\{namespace\}/g, TEST_NAMESPACE);
      sql = sql.replace(/\$\{default_password\}/g, "test_password");

      await db.execute(sql);
    }
  }
}

async function withAdminDb(
  connectionString: string,
  callback: (db: NodePgDatabase) => Promise<void>,
) {
  const adminDb = drizzle(connectionString + `/postgres`);

  try {
    return await callback(adminDb);
  } finally {
    await adminDb.$client.end();
  }
}
