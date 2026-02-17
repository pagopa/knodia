import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const TEST_POSTGRES_DB_PORT = 5432;
const TEST_POSTGRES_IMAGE = "postgres:18";

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

async function applyMigrations(migrationFolders: string[], db: NodePgDatabase) {
  for (const migration of migrationFolders) {
    await migrate(db, {
      migrationsFolder: migration,
    });
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
