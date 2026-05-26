import { createTestLogger } from "@knodia/test-commons/utils";
import { describe, expect, it, vi } from "vitest";

// The package-wide setupFile mocks "ioredis" with ioredis-mock, which always
// connects successfully and so cannot reproduce the retry-timer leak this
// test guards against. Unmock for this file only and use the real client.
vi.unmock("ioredis");

import { initRedisRateLimiter } from "../../src/rate-limit/rateLimiter.ts";

const { logger: testLogger } = createTestLogger();

// ioredis exposes `manuallyClosing` and `reconnectTimeout` as long-standing
// internal fields used by its own reconnect machinery; we read them as the
// stable signal that disconnect() actually tore down the retry loop.
interface IoRedisInternals {
  manuallyClosing: boolean;
  reconnectTimeout: NodeJS.Timeout | null;
}

describe("initRedisRateLimiter#disconnect (regression)", () => {
  it("clears the reconnect timer when Redis was never reachable", async () => {
    // Port 1 is privileged: nothing listens, connections refuse immediately.
    // Pre-fix, the limiter only called redis.quit(), which rejects without
    // clearing the retry strategy's pending setTimeout — that timer pinned
    // the event loop and hung the generate-openapi CI job for KN-161.
    const rateLimiter = initRedisRateLimiter({
      config: {
        rateLimiterMaxRequests: 10,
        rateLimiterRedisHost: "127.0.0.1",
        rateLimiterRedisPort: 1,
        rateLimiterTimeoutSeconds: 2,
        rateLimiterTimeWindowSeconds: 60,
      },
      knodeId: "Orion",
      logger: testLogger,
      serviceName: "backend-for-frontend",
    });
    const internals = rateLimiter.redis as unknown as IoRedisInternals;

    // Let the retry strategy schedule its first reconnect attempt.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(internals.reconnectTimeout).not.toBeNull();
    expect(internals.manuallyClosing).toBe(false);

    await rateLimiter.disconnect();

    expect(internals.reconnectTimeout).toBeNull();
    expect(internals.manuallyClosing).toBe(true);
  });
});
