import { GenericContainer } from "testcontainers";

const TEST_POSTGRES_DB_PORT = 5432;
const TEST_POSTGRES_IMAGE = "postgres:14";

export async function startTestPostgresContainer({
  dbPassword,
  dbUser,
}: {
  dbPassword: string;
  dbUser: string;
}) {
  const container = await new GenericContainer(TEST_POSTGRES_IMAGE)
    .withExposedPorts(TEST_POSTGRES_DB_PORT)
    .withReuse()
    .withEnvironment({
      POSTGRES_PASSWORD: dbPassword,
      POSTGRES_USER: dbUser,
    })
    .start();

  const port = container.getMappedPort(TEST_POSTGRES_DB_PORT);
  const connectionString = `postgresql://${dbUser}:${dbPassword}@${container.getHost()}:${port}`;

  return { connectionString, container, port };
}
