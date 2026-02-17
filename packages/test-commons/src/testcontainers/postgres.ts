import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

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
  migrationsRoot,
  rolesMigrationFolder,
  templateName,
}: {
  connectionString: string;
  migrationsRoot: string;
  rolesMigrationFolder: string;
  templateName: string;
}) {
  await withAdminDb(connectionString, async (adminDb) => {
    await applyMigrations(rolesMigrationFolder, adminDb);

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
      await applyMigrations(migrationsRoot, templateDb);
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
  const container = await new PostgreSqlContainer(TEST_POSTGRES_IMAGE)
    .withName(testContainerName)
    .withReuse()
    .withPassword(password)
    .withUsername(user)
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
 * Applies SQL migrations from a folder: executes .sql files in the folder itself,
 * then iterates subfolders (one per domain schema) if exist and executes their .sql files.
 */
async function applyMigrations(folder: string, db: NodePgDatabase) {
  const entries = readdirSync(folder);

  const sqlFiles = entries.filter((f) => f.endsWith(".sql")).sort();
  for (const file of sqlFiles) {
    const filePath = join(folder, file);
    let sql = readFileSync(filePath, "utf-8");

    sql = sql.replace(/\$\{NAMESPACE\}/g, TEST_NAMESPACE);
    sql = sql.replace(/\$\{DEFAULT_PASSWORD\}/g, "test_password");

    await db.execute(sql);
  }

  const subfolders = entries
    .filter((entry) => statSync(join(folder, entry)).isDirectory())
    .sort();

  for (const subfolder of subfolders) {
    await applyMigrations(join(folder, subfolder), db);
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
