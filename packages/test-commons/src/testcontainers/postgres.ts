import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { fileURLToPath } from "node:url";
import {
  GenericContainer,
  Network,
  type StartedNetwork,
  Wait,
} from "testcontainers";

const TEST_POSTGRES_DB_PORT = 5432;
const TEST_POSTGRES_IMAGE = "postgres:17.7";
const FLYWAY_IMAGE = "flyway/flyway:11";
const NAMESPACE = "test";
const DB_USER = "root";
const DB_PASSWORD = "root";

const FLYWAY_SCRIPTS_PATH = fileURLToPath(
  new URL(`../../../../scripts/flyway`, import.meta.url),
);


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

/**
 * !!! Intended to be called once in global test setup !!!
 *
 * Creates template databases and runs all Flyway migrations in a single container.
 * Handles role creation (cluster-wide, idempotent) and schema migrations for
 * each template. Each entry maps a template name to its migrations directory,
 * whose subdirectories become schemas (e.g. migration/event-store/eservice → test_eservice).
 * If the Postgres container is reused from a previous run, Flyway is incremental.
 */
export async function runTestFlywayMigrations({
  connectionString,
  network,
  templates,
}: {
  connectionString: string;
  network: StartedNetwork;
  templates: { migrationsRoot: string; templateName: string }[];
}) {
  await withAdminDb(connectionString, async (adminDb) => {
    for (const { templateName } of templates) {
      const existsResult = await adminDb.execute(
        `SELECT 1 FROM pg_database WHERE datname = '${templateName}'`,
      );

      const rows = existsResult.rows;
      const templateExists = Array.isArray(rows) && rows.length > 0;

      if (!templateExists) {
        await adminDb.execute(`CREATE DATABASE "${templateName}"`);
      }
    }
  });

  const mounts: { source: string; target: string }[] = [
    { source: FLYWAY_SCRIPTS_PATH, target: "/flyway/scripts" },
  ];

  for (const { migrationsRoot, templateName } of templates) {
    mounts.push({
      source: migrationsRoot,
      target: `/flyway/databases/${templateName}`,
    });
  }

  await runFlywayContainer({
    command: ["/flyway/scripts/migrate-all-databases.sh"],
    entrypoint: ["/bin/sh"],
    environment: {
      FLYWAY_BASELINE_ON_MIGRATE: "true",
      FLYWAY_PASSWORD: DB_PASSWORD,
      FLYWAY_PLACEHOLDERS_NAMESPACE: NAMESPACE,
      FLYWAY_USER: DB_USER,
    },
    mounts,
    network,
  });

  await withAdminDb(connectionString, async (adminDb) => {
    for (const { templateName } of templates) {
      await adminDb.execute(
        `ALTER DATABASE "${templateName}" IS_TEMPLATE true`,
      );
    }
  });
}

export async function setupPostgresTestContainer() {
  const network = await new Network().start();

  const container = await new PostgreSqlContainer(TEST_POSTGRES_IMAGE)
    .withNetwork(network)
    .withNetworkAliases("postgres")
    .withName("knodia-postgres-test-container")
    .withReuse()
    .withPassword(DB_PASSWORD)
    .withUsername(DB_USER)
    .start();

  const port = container.getMappedPort(TEST_POSTGRES_DB_PORT);
  const host = container.getHost();
  const connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${host}:${port}`;

  return { connectionString, container, network };
}

async function runFlywayContainer({
  command,
  entrypoint,
  environment,
  mounts,
  network,
}: {
  command: string[];
  entrypoint: string[];
  environment: Record<string, string>;
  mounts: { source: string; target: string }[];
  network: StartedNetwork;
}) {
  const startedContainer = await new GenericContainer(FLYWAY_IMAGE)
    .withNetwork(network)
    .withEnvironment(environment)
    .withEntrypoint(entrypoint)
    .withCommand(command)
    .withWaitStrategy(Wait.forOneShotStartup())
    .withBindMounts(mounts.map((mount) => ({ mode: "ro" as const, ...mount })))
    .start();

  await startedContainer.stop();
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

declare module "vitest" {
  export interface ProvidedContext {
    POSTGRES_CONNECTION_STRING: string;
  }
}
