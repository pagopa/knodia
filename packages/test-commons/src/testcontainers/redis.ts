import { GenericContainer } from "testcontainers";

const REDIS_PORT = 6379;
const REDIS_IMAGE = "redis:7-alpine";

/**
 * !!! Intended to be called once in global test setup !!!
 *
 *  Starts the shared Redis test container.
 *  It returns the connection string to be used by test files.
 */
export async function setupRedisTestContainer() {
  const container = await new GenericContainer(REDIS_IMAGE)
    .withExposedPorts(REDIS_PORT)
    .withReuse()
    .start();

  const host = container.getHost();
  const mappedPort = container.getMappedPort(REDIS_PORT);
  const connectionString = `redis://${host}:${mappedPort}`;

  return { connectionString, container };
}

declare module "vitest" {
  export interface ProvidedContext {
    REDIS_CONNECTION_STRING: string;
  }
}
