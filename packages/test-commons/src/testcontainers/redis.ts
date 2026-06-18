import { GenericContainer, Wait } from "testcontainers";

const REDIS_PORT = 6379;

// Pinned to the same digest used by docker/compose.yaml so dev and CI run
// the same Redis build.
const REDIS_IMAGE =
  "redis:8.6.3-alpine@sha256:d146f83b1e0f02fc27c26a50cee39338c736674c5959db84363e6ae3cd9e02d2";

/**
 * !!! Intended to be called once in global test setup !!!
 *
 * Starts a shared Redis test container used by the rate-limiter. Sets
 * RATE_LIMITER_REDIS_HOST / RATE_LIMITER_REDIS_PORT on `process.env` so
 * services that read those env vars at startup (via @dotenvx/dotenvx or
 * direct `process.env` lookups in tests) pick up the container address.
 */
export async function setupRedisTestContainer() {
  const container = await new GenericContainer(REDIS_IMAGE)
    .withName("knodia-redis-test-container")
    .withLabels({ "com.docker.compose.project": "knodia-test" })
    .withExposedPorts(REDIS_PORT)
    .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
    .withReuse()
    .start();

  process.env["RATE_LIMITER_REDIS_HOST"] = container.getHost();
  process.env["RATE_LIMITER_REDIS_PORT"] = String(
    container.getMappedPort(REDIS_PORT),
  );

  return { container };
}
