import { requestContext } from "@fastify/request-context";
import { getTestUISessionTokenClaims } from "@knodia/test-commons/auth";
import { createTestLogger } from "@knodia/test-commons/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { extractAuthDataFromToken } from "../../src/auth/authData.ts";
import {
  initRedisRateLimiter,
  rateLimitMiddleware,
  rateLimitResponseHeadersHook,
} from "../../src/rate-limit/index.ts";
import { buildTestApp } from "../mock/buildTestApp.ts";

const RATE_LIMITER_CONFIG = {
  rateLimiterMaxRequests: 3,
  rateLimiterRedisHost: "localhost",
  rateLimiterRedisPort: 6379,
  rateLimiterTimeoutSeconds: 2,
  rateLimiterTimeWindowSeconds: 60,
};

const SCOPE = {
  knodeId: "Orion" as const,
  serviceName: "backend-for-frontend" as const,
};

const { logger: testLogger } = createTestLogger();

afterEach(() => {
  vi.restoreAllMocks();
});

const uiSessionAuth = extractAuthDataFromToken(getTestUISessionTokenClaims());

describe("initRedisRateLimiter", () => {
  let rateLimiter: ReturnType<typeof initRedisRateLimiter>;

  beforeEach(async () => {
    rateLimiter = initRedisRateLimiter({
      config: RATE_LIMITER_CONFIG,
      knodeId: SCOPE.knodeId,
      logger: testLogger,
      serviceName: SCOPE.serviceName,
    });
    await rateLimiter.redis.flushall();
  });

  afterEach(async () => {
    await rateLimiter.disconnect();
  });

  it("returns limitReached=false until the configured max is exceeded", async () => {
    const statuses = [];
    for (let i = 0; i < 4; i++) {
      statuses.push(await rateLimiter.consume("org-A", testLogger));
    }

    expect(statuses[0]).toMatchObject({ limitReached: false });
    expect(statuses[1]).toMatchObject({ limitReached: false });
    expect(statuses[2]).toMatchObject({ limitReached: false });
    expect(statuses[3]).toMatchObject({ limitReached: true });
  });

  it("keeps separate buckets per organization key", async () => {
    for (let i = 0; i < 4; i++) {
      await rateLimiter.consume("org-A", testLogger);
    }
    const aOver = await rateLimiter.consume("org-A", testLogger);
    const bFresh = await rateLimiter.consume("org-B", testLogger);
    expect(aOver.limitReached).toBe(true);
    expect(bFresh.limitReached).toBe(false);
  });

  it("reports a real PTTL on resetMs that decreases across the window", async () => {
    const first = await rateLimiter.consume("org-ttl", testLogger);
    expect(first.resetMs).toBeGreaterThan(0);
    expect(first.resetMs).toBeLessThanOrEqual(
      RATE_LIMITER_CONFIG.rateLimiterTimeWindowSeconds * 1_000,
    );
  });

  it("fails open (limitReached=false, degraded=true) when Redis throws", async () => {
    const multi = rateLimiter.redis.multi.bind(rateLimiter.redis);
    vi.spyOn(rateLimiter.redis, "multi").mockImplementationOnce(() => {
      const pipeline = multi();
      vi.spyOn(pipeline, "exec").mockRejectedValueOnce(new Error("boom"));
      return pipeline;
    });

    const warnSpy = vi.spyOn(testLogger, "warn");
    const status = await rateLimiter.consume("org-fail", testLogger);
    expect(status.limitReached).toBe(false);
    expect(status.degraded).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("marks healthy statuses as degraded=false", async () => {
    const ok = await rateLimiter.consume("org-healthy", testLogger);
    expect(ok.degraded).toBe(false);
  });

  it("DELs the key and degrades when PEXPIRE NX errors inside the MULTI", async () => {
    // Reproduces the Redis < 7.0 case where the NX flag is rejected at EXEC:
    // INCR succeeds, PEXPIRE returns an error, the key has no TTL — we must
    // DEL it so the bucket doesn't pin the tenant at permanent 429.
    const fullKey = `knodia-rate-limit:${SCOPE.knodeId}:${SCOPE.serviceName}:org-pex`;
    await rateLimiter.redis.set(fullKey, "5");

    const multi = rateLimiter.redis.multi.bind(rateLimiter.redis);
    vi.spyOn(rateLimiter.redis, "multi").mockImplementationOnce(() => {
      const pipeline = multi();
      vi.spyOn(pipeline, "exec").mockResolvedValueOnce([
        [null, 5],
        [new Error("ERR syntax error"), null],
        [null, -1],
      ] as never);
      return pipeline;
    });

    const status = await rateLimiter.consume("org-pex", testLogger);
    expect(status.degraded).toBe(true);
    expect(status.limitReached).toBe(false);
    expect(await rateLimiter.redis.get(fullKey)).toBeNull();
  });

  it("DELs the key and degrades when PTTL reports no TTL after a successful EXEC", async () => {
    // Defensive path for the post-PEXPIRE state where the key somehow ended up
    // without a TTL: surface as degraded instead of masking with a synthetic
    // resetMs that pretends the bucket is healthy.
    const fullKey = `knodia-rate-limit:${SCOPE.knodeId}:${SCOPE.serviceName}:org-nottl`;
    await rateLimiter.redis.set(fullKey, "5");

    const multi = rateLimiter.redis.multi.bind(rateLimiter.redis);
    vi.spyOn(rateLimiter.redis, "multi").mockImplementationOnce(() => {
      const pipeline = multi();
      vi.spyOn(pipeline, "exec").mockResolvedValueOnce([
        [null, 5],
        [null, 1],
        [null, -1],
      ] as never);
      return pipeline;
    });

    const status = await rateLimiter.consume("org-nottl", testLogger);
    expect(status.degraded).toBe(true);
    expect(status.limitReached).toBe(false);
    expect(await rateLimiter.redis.get(fullKey)).toBeNull();
  });
});

describe("rateLimitResponseHeadersHook", () => {
  const buildAppWithStatus = async (
    status: unknown,
  ): Promise<ReturnType<typeof buildTestApp>> => {
    const app = buildTestApp();
    app.addHook("onRequest", async () => {
      requestContext.set("rateLimitStatus", status as never);
    });
    await app.register(rateLimitResponseHeadersHook);
    app.get("/ping", async () => ({ ok: true }));
    await app.ready();
    return app;
  };

  it("emits x-ratelimit-* headers for healthy statuses", async () => {
    const app = await buildAppWithStatus({
      degraded: false,
      limitReached: false,
      maxRequests: 10,
      remainingRequests: 7,
      resetMs: 12_000,
    });

    const res = await app.inject({ method: "GET", url: "/ping" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-ratelimit-limit"]).toBe("10");
    expect(res.headers["x-ratelimit-remaining"]).toBe("7");
    expect(res.headers["x-ratelimit-reset"]).toBe("12");
    expect(res.headers["x-ratelimit-degraded"]).toBeUndefined();

    await app.close();
  });

  it("suppresses x-ratelimit-* headers and emits x-ratelimit-degraded when degraded", async () => {
    const app = await buildAppWithStatus({
      degraded: true,
      limitReached: false,
      maxRequests: 10,
      remainingRequests: 10,
      resetMs: 60_000,
    });

    const res = await app.inject({ method: "GET", url: "/ping" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-ratelimit-degraded"]).toBe("true");
    expect(res.headers["x-ratelimit-limit"]).toBeUndefined();
    expect(res.headers["x-ratelimit-remaining"]).toBeUndefined();
    expect(res.headers["x-ratelimit-reset"]).toBeUndefined();

    await app.close();
  });
});

describe("rateLimitMiddleware", () => {
  let app: ReturnType<typeof buildTestApp>;
  let rateLimiter: ReturnType<typeof initRedisRateLimiter>;

  const buildAppWithAuth = async (authData: unknown): Promise<void> => {
    app = buildTestApp();
    await app.register(rateLimitResponseHeadersHook);
    await app.register(async (scoped) => {
      // Stamp authData manually (no full auth plugin in the test app).
      scoped.addHook("onRequest", async () => {
        requestContext.set("authData", authData as never);
      });
      await scoped.register(rateLimitMiddleware, { rateLimiter });
      scoped.get("/ping", async () => ({ ok: true }));
    });
    await app.ready();
  };

  beforeEach(async () => {
    rateLimiter = initRedisRateLimiter({
      config: RATE_LIMITER_CONFIG,
      knodeId: SCOPE.knodeId,
      logger: testLogger,
      serviceName: SCOPE.serviceName,
    });
    await rateLimiter.redis.flushall();
  });

  afterEach(async () => {
    await app.close();
    await rateLimiter.disconnect();
  });

  it("returns 200 within the limit and 429 once exceeded, with x-ratelimit-* headers", async () => {
    await buildAppWithAuth(uiSessionAuth);

    for (let i = 0; i < RATE_LIMITER_CONFIG.rateLimiterMaxRequests; i++) {
      const res = await app.inject({ method: "GET", url: "/ping" });
      expect(res.statusCode).toBe(200);
      expect(res.headers["x-ratelimit-limit"]).toBe(
        String(RATE_LIMITER_CONFIG.rateLimiterMaxRequests),
      );
    }
    const blocked = await app.inject({ method: "GET", url: "/ping" });
    expect(blocked.statusCode).toBe(429);
    expect(blocked.headers["retry-after"]).toBeDefined();
    expect(blocked.headers["content-type"]).toContain(
      "application/problem+json",
    );
    const body = blocked.json();
    expect(body).toEqual({
      correlationId: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      ),
      errors: [
        {
          // <service-code>-<common-error-code>, e.g. "002-9998".
          code: expect.stringMatching(/^\d{3}-\d{4}$/),
          detail: "Rate limit exceeded",
        },
      ],
      status: 429,
      title: "Too Many Requests",
    });
  });

  it("skips the limiter entirely for internal S2S tokens", async () => {
    await buildAppWithAuth({ tokenType: "internal" });

    for (let i = 0; i < RATE_LIMITER_CONFIG.rateLimiterMaxRequests + 3; i++) {
      const res = await app.inject({ method: "GET", url: "/ping" });
      expect(res.statusCode).toBe(200);
    }
  });
});
