import { requestContext } from "@fastify/request-context";
import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import { getTestUISessionTokenClaims } from "@knodia/test-commons/auth";
import { createTestLogger } from "@knodia/test-commons/utils";
import { RateLimiterRedis, type RateLimiterRes } from "rate-limiter-flexible";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AuthData,
  extractAuthDataFromToken,
  type UISessionAuthData,
} from "../../src/auth/authData.ts";
import { type RateLimiterConfig } from "../../src/rate-limit/config.ts";
import {
  initRedisRateLimiter,
  rateLimitPlugin,
  rateLimitResponseHeadersPlugin,
} from "../../src/rate-limit/index.ts";
import { type RateLimiter } from "../../src/rate-limit/rateLimiter.ts";
import { buildTestApp } from "../mock/buildTestApp.ts";

const MAX_REQUESTS = 3;

const SCOPE = {
  knodeId: "Orion" as const,
  serviceName: "backend-for-frontend" as const,
};

const { logger: testLogger } = createTestLogger();

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function getBaseUiSessionAuth(): UISessionAuthData {
  const authData = extractAuthDataFromToken(getTestUISessionTokenClaims());
  if (authData.tokenType !== "ui-session") {
    throw new Error("Expected test UI session claims");
  }
  return authData;
}

const baseUiSessionAuth = getBaseUiSessionAuth();

function buildRateLimiter(
  config: RateLimiterConfig = buildRateLimiterConfig(),
): RateLimiter {
  return initRedisRateLimiter({
    config,
    knodeId: SCOPE.knodeId,
    logger: testLogger,
    serviceName: SCOPE.serviceName,
  });
}

function buildRateLimiterConfig(
  overrides: Partial<RateLimiterConfig> = {},
): RateLimiterConfig {
  return {
    rateLimiterAwsIamAuth: undefined,
    rateLimiterEnvironment: "test",
    rateLimiterMaxRequests: MAX_REQUESTS,
    rateLimiterRedisHost: process.env["RATE_LIMITER_REDIS_HOST"] ?? "127.0.0.1",
    rateLimiterRedisPort: Number(
      process.env["RATE_LIMITER_REDIS_PORT"] ?? 6379,
    ),
    rateLimiterTimeoutSeconds: 1,
    rateLimiterTimeWindowSeconds: 60,
    ...overrides,
  };
}

function freshOrganizationId(): OrganizationId {
  return generateId<OrganizationId>();
}

function freshUiSessionAuth(): UISessionAuthData {
  return {
    ...baseUiSessionAuth,
    organizationId: freshOrganizationId(),
  };
}

async function waitForHealthyLimiter(rateLimiter: RateLimiter): Promise<void> {
  let lastStatus: Awaited<ReturnType<RateLimiter["consume"]>> | undefined;

  for (let attempt = 0; attempt < 20; attempt++) {
    lastStatus = await rateLimiter.consume(freshOrganizationId(), testLogger);
    if (!lastStatus.degraded) {
      return;
    }
    await delay(50);
  }

  throw new Error(
    `Redis rate limiter did not become healthy: ${JSON.stringify(lastStatus)}`,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("initRedisRateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(async () => {
    rateLimiter = buildRateLimiter();
    await waitForHealthyLimiter(rateLimiter);
  });

  afterEach(async () => {
    await rateLimiter.disconnect();
  });

  it("returns limitReached=false until the configured max is exceeded", async () => {
    const organizationId = freshOrganizationId();
    const statuses = [];

    for (let i = 0; i < MAX_REQUESTS + 1; i++) {
      statuses.push(await rateLimiter.consume(organizationId, testLogger));
    }

    for (const status of statuses.slice(0, MAX_REQUESTS)) {
      expect(status).toMatchObject({
        degraded: false,
        limitReached: false,
        maxRequests: MAX_REQUESTS,
      });
    }
    expect(statuses[MAX_REQUESTS]).toMatchObject({
      degraded: false,
      limitReached: true,
      maxRequests: MAX_REQUESTS,
      remainingRequests: 0,
    });
  });

  it("keeps separate buckets per organization key", async () => {
    const organizationA = freshOrganizationId();
    const organizationB = freshOrganizationId();

    for (let i = 0; i < MAX_REQUESTS; i++) {
      await rateLimiter.consume(organizationA, testLogger);
    }

    const aOver = await rateLimiter.consume(organizationA, testLogger);
    const bFresh = await rateLimiter.consume(organizationB, testLogger);

    expect(aOver.limitReached).toBe(true);
    expect(bFresh.limitReached).toBe(false);
  });

  it("reports resetMs within the configured window", async () => {
    const status = await rateLimiter.consume(freshOrganizationId(), testLogger);

    expect(status.degraded).toBe(false);
    expect(status.resetMs).toBeGreaterThan(0);
    expect(status.resetMs).toBeLessThanOrEqual(
      buildRateLimiterConfig().rateLimiterTimeWindowSeconds * 1_000,
    );
  });

  it("fails open when Redis is unavailable", async () => {
    const unavailableRateLimiter = buildRateLimiter(
      buildRateLimiterConfig({
        rateLimiterRedisHost: "127.0.0.1",
        rateLimiterRedisPort: 1,
      }),
    );
    const warnSpy = vi.spyOn(testLogger, "warn");

    const status = await unavailableRateLimiter.consume(
      freshOrganizationId(),
      testLogger,
    );
    await unavailableRateLimiter.disconnect();

    expect(status).toEqual({
      degraded: true,
      limitReached: false,
      maxRequests: MAX_REQUESTS,
      remainingRequests: MAX_REQUESTS,
      resetMs: buildRateLimiterConfig().rateLimiterTimeWindowSeconds * 1_000,
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("fails open when a connected Redis stalls past the consume timeout", async () => {
    // A stalled-but-connected Redis (failover, slow Lua, moved slot while TCP
    // stays up) never settles consume(), so only the Promise.race timeout can
    // unblock the request. Mock the underlying consume to hang and give the
    // limiter a short timeout so the race resolves quickly.
    const stalledRateLimiter = buildRateLimiter(
      buildRateLimiterConfig({ rateLimiterTimeoutSeconds: 0.1 }),
    );
    vi.spyOn(RateLimiterRedis.prototype, "consume").mockImplementation(
      () => new Promise<RateLimiterRes>(() => undefined),
    );
    const warnSpy = vi.spyOn(testLogger, "warn");

    const status = await stalledRateLimiter.consume(
      freshOrganizationId(),
      testLogger,
    );
    await stalledRateLimiter.disconnect();

    expect(status).toEqual({
      degraded: true,
      limitReached: false,
      maxRequests: MAX_REQUESTS,
      remainingRequests: MAX_REQUESTS,
      resetMs: buildRateLimiterConfig().rateLimiterTimeWindowSeconds * 1_000,
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("timed out"));
  });

  it("degrades after disconnect", async () => {
    await rateLimiter.disconnect();

    const status = await rateLimiter.consume(freshOrganizationId(), testLogger);

    expect(status).toMatchObject({
      degraded: true,
      limitReached: false,
      remainingRequests: MAX_REQUESTS,
    });
  });
});

describe("rateLimitResponseHeadersPlugin", () => {
  const buildAppWithStatus = async (
    status: unknown,
  ): Promise<ReturnType<typeof buildTestApp>> => {
    const app = buildTestApp();
    app.addHook("onRequest", async () => {
      requestContext.set("rateLimitStatus", status as never);
    });
    await app.register(rateLimitResponseHeadersPlugin);
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

describe("rateLimitPlugin", () => {
  let app: ReturnType<typeof buildTestApp> | undefined;
  let rateLimiter: RateLimiter | undefined;

  const getApp = (): ReturnType<typeof buildTestApp> => {
    if (!app) {
      throw new Error("Test app was not initialized");
    }
    return app;
  };

  const getRateLimiter = (): RateLimiter => {
    if (!rateLimiter) {
      throw new Error("Rate limiter was not initialized");
    }
    return rateLimiter;
  };

  const buildAppWithAuth = async (authData: AuthData): Promise<void> => {
    app = buildTestApp();
    await app.register(rateLimitResponseHeadersPlugin);
    await app.register(async (scoped) => {
      // Stamp authData manually (no full auth plugin in the test app).
      scoped.addHook("onRequest", async () => {
        requestContext.set("authData", authData as never);
      });
      await scoped.register(rateLimitPlugin, { rateLimiter: getRateLimiter() });
      scoped.get("/ping", async () => ({ ok: true }));
    });
    await app.ready();
  };

  beforeEach(async () => {
    rateLimiter = buildRateLimiter();
    await waitForHealthyLimiter(rateLimiter);
  });

  afterEach(async () => {
    await app?.close();
    await rateLimiter?.disconnect();
    app = undefined;
    rateLimiter = undefined;
  });

  it("returns 200 within the limit and 429 once exceeded, with x-ratelimit-* headers", async () => {
    await buildAppWithAuth(freshUiSessionAuth());

    for (let i = 0; i < MAX_REQUESTS; i++) {
      const res = await getApp().inject({ method: "GET", url: "/ping" });
      expect(res.statusCode).toBe(200);
      expect(res.headers["x-ratelimit-limit"]).toBe(String(MAX_REQUESTS));
    }
    const blocked = await getApp().inject({ method: "GET", url: "/ping" });
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

    for (let i = 0; i < MAX_REQUESTS + 3; i++) {
      const res = await getApp().inject({ method: "GET", url: "/ping" });
      expect(res.statusCode).toBe(200);
    }
  });
});
