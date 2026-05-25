import { afterEach, vi } from "vitest";

vi.mock("ioredis", async () => {
  const Mock = (await import("ioredis-mock")).default;
  return { default: Mock, Redis: Mock };
});

// ioredis-mock shares state per host:port within a process, so rate-limit
// counters accumulate across tests in the same file unless we flush. The
// dedicated rate-limit tests already flush in their own beforeEach; this
// hook covers integration test suites (BFF, signal-hub, authorization-server)
// where the rate limiter is built internally by the app and not exposed.
afterEach(async () => {
  const { default: Mock } = await import("ioredis-mock");
  const redis = new Mock({ host: "localhost", port: 6379 });
  await redis.flushall();
  redis.disconnect();
});
