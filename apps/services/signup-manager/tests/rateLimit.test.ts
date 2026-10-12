import type { Producer } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { FastifyInstance } from "fastify";

import { generateId } from "@knodia/common-models/ids";
import {
  hashRateLimitKey,
  initRedisRateLimiter,
  type RateLimiter,
} from "@knodia/fastify-zod-api-commons/rate-limit";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import { createTestLogger } from "@knodia/test-commons/utils";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mockAxiosPost = vi.hoisted(() => vi.fn());
const mockGenerateUISignupSessionToken = vi.hoisted(() => vi.fn());
const mockJwtVerify = vi.hoisted(() => vi.fn());

vi.mock("axios", async (importOriginal) => {
  const original = await importOriginal<typeof import("axios")>();

  return {
    ...original,
    default: { ...original.default, post: mockAxiosPost },
    post: mockAxiosPost,
  };
});
vi.mock("jose", async (importOriginal) => {
  const original = await importOriginal<typeof import("jose")>();

  return {
    ...original,
    createRemoteJWKSet: vi.fn(() => "mock-jwks"),
    jwtVerify: mockJwtVerify,
  };
});
vi.mock("@knodia/token-generator", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@knodia/token-generator")>()),
  tokenGeneratorBuilder: () => ({
    generateUISignupSessionToken: mockGenerateUISignupSessionToken,
  }),
}));

import { buildApp } from "../src/app.ts";
import { OIDC_SESSION_COOKIE_NAME } from "../src/models/api.ts";
import { signupDb, signupManagerTestConfig } from "./setup.ts";

// Toggleable stub: records keys passed to `consume` and returns 429 on demand,
// so we assert the wiring (key extraction + 429 mapping) without Redis state.
let limitReached = false;
const consumedKeys: string[] = [];
const stubRateLimiter: RateLimiter = {
  consume: async (key) => {
    consumedKeys.push(key);
    return {
      degraded: false,
      limitReached,
      maxRequests: 5,
      remainingRequests: limitReached ? 0 : 5,
      resetMs: 60_000,
    };
  },
  disconnect: async () => undefined,
};

const kafkaProducerMock = { send: vi.fn<Producer["send"]>() };

let app: FastifyInstance;

beforeAll(async () => {
  app = buildApp({
    config: signupManagerTestConfig,
    kafkaProducer: kafkaProducerMock as unknown as Producer,
    rateLimiter: stubRateLimiter,
    signupDb,
  });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  limitReached = false;
  consumedKeys.length = 0;
  mockAxiosPost.mockReset();
  mockJwtVerify.mockReset();
  mockGenerateUISignupSessionToken.mockReset();
  mockGenerateUISignupSessionToken.mockResolvedValue({
    serialized: "mock-signup-session-token",
  });
});

describe("rate limiting on protected routes", () => {
  it("keys the bucket on the hashed ui-signup-session unique identifier", async () => {
    const response = await injectSignupRequest("user-A").get("/user/me");

    expect(response.statusCode).toBe(200);
    expect(consumedKeys).toEqual([hashRateLimitKey("user-A")]);
  });

  it("uses a distinct key per signup user", async () => {
    await injectSignupRequest("user-A").get("/user/me");
    await injectSignupRequest("user-B").get("/user/me");

    expect(consumedKeys).toEqual([
      hashRateLimitKey("user-A"),
      hashRateLimitKey("user-B"),
    ]);
  });

  it("does not leak the raw identifier into the bucket key", async () => {
    await injectSignupRequest("user-A").get("/user/me");

    expect(consumedKeys).not.toContain("user-A");
  });

  it("returns 429 when the limit is reached", async () => {
    limitReached = true;

    const response = await injectSignupRequest("user-A").get("/user/me");

    expect(response.statusCode).toBe(429);
    expect(response.json()).toHaveProperty("status", 429);
    expect(consumedKeys).toEqual([hashRateLimitKey("user-A")]);
  });
});

describe("rate limiting on GET /auth/oidc/token", () => {
  it("keys the bucket on the resolved subject", async () => {
    const { cookie, nonce, state } = await startOIDCSession();
    setupSuccessfulTokenExchange(nonce);

    const response = await exchangeCode(cookie, state);

    expect(response.statusCode).toBe(200);
    // The mock carries both spidCode and fiscalNumber; spidCode wins.
    expect(consumedKeys).toEqual([hashRateLimitKey("test-spid-code")]);
  });

  it("returns 429 without minting a token when the limit is reached", async () => {
    const { cookie, nonce, state } = await startOIDCSession();
    setupSuccessfulTokenExchange(nonce);
    limitReached = true;

    const response = await exchangeCode(cookie, state);

    expect(response.statusCode).toBe(429);
    expect(consumedKeys).toEqual([hashRateLimitKey("test-spid-code")]);
    expect(mockGenerateUISignupSessionToken).not.toHaveBeenCalled();
  });
});

describe("rate limiting integration (real Redis)", () => {
  const MAX_REQUESTS = 3;
  const { logger } = createTestLogger();

  let integrationApp: FastifyInstance;
  let realRateLimiter: RateLimiter;

  const injectIntegrationRequest = (uniqueIdentifier: string) =>
    createInjectAppRequest(() => integrationApp)({
      oneIdNonce: "test-nonce",
      type: "ui-signup-session",
      uniqueIdentifier,
    });

  beforeAll(async () => {
    // signup-manager isn't tied to a Knode, so no knodeId — mirrors index.ts.
    realRateLimiter = initRedisRateLimiter({
      config: {
        rateLimiterAwsIamAuth: undefined,
        rateLimiterEnvironment: "test",
        rateLimiterMaxRequests: MAX_REQUESTS,
        rateLimiterRedisHost:
          process.env["RATE_LIMITER_REDIS_HOST"] ?? "127.0.0.1",
        rateLimiterRedisPort: Number(
          process.env["RATE_LIMITER_REDIS_PORT"] ?? 6379,
        ),
        rateLimiterTimeoutSeconds: 2,
        rateLimiterTimeWindowSeconds: 60,
      },
      logger,
      serviceName: "signup-manager",
    });

    integrationApp = buildApp({
      config: signupManagerTestConfig,
      kafkaProducer: kafkaProducerMock as unknown as Producer,
      rateLimiter: realRateLimiter,
      signupDb,
    });
    await integrationApp.ready();
    await waitForHealthyLimiter(realRateLimiter, logger);
  });

  // buildApp registers an onClose hook that disconnects the limiter.
  afterAll(async () => {
    await integrationApp.close();
  });

  it("allows requests up to the limit, then returns 429", async () => {
    // Fresh identifier per test: the reused container keeps bucket state across
    // runs, so a unique key guarantees an empty bucket.
    const identifier = `integration-${generateId()}`;

    for (let i = 0; i < MAX_REQUESTS; i++) {
      const response =
        await injectIntegrationRequest(identifier).get("/user/me");
      expect(response.statusCode).toBe(200);
    }

    const blocked = await injectIntegrationRequest(identifier).get("/user/me");
    expect(blocked.statusCode).toBe(429);
    expect(blocked.headers["retry-after"]).toBeDefined();
  });

  it("keeps a separate bucket per signup user", async () => {
    const userA = `integration-${generateId()}`;
    const userB = `integration-${generateId()}`;

    for (let i = 0; i < MAX_REQUESTS; i++) {
      await injectIntegrationRequest(userA).get("/user/me");
    }

    const aOver = await injectIntegrationRequest(userA).get("/user/me");
    const bFresh = await injectIntegrationRequest(userB).get("/user/me");

    expect(aOver.statusCode).toBe(429);
    expect(bFresh.statusCode).toBe(200);
  });
});

function exchangeCode(cookie: string, state: string) {
  return app.inject({
    cookies: { [OIDC_SESSION_COOKIE_NAME]: cookie },
    method: "GET",
    url: `/auth/oidc/token?code=auth-code-123&state=${state}`,
  });
}

function injectSignupRequest(uniqueIdentifier: string) {
  return createInjectAppRequest(() => app)({
    oneIdNonce: "test-nonce",
    type: "ui-signup-session",
    uniqueIdentifier,
  });
}

function setupSuccessfulTokenExchange(nonce: string) {
  mockAxiosPost.mockResolvedValueOnce({
    data: {
      access_token: "mock-access-token",
      expires_in: 3600,
      id_token: "mock.id.token",
      scope: "openid",
      token_type: "Bearer",
    },
  });
  mockJwtVerify.mockResolvedValueOnce({
    payload: {
      aud: "test-one-identity-client-id",
      dateOfBirth: "2000-01-01",
      exp: 9_999_999_999,
      familyName: "User",
      fiscalNumber: "XXXXXX00X00X000X",
      iat: 0,
      iss: "https://test.one-identity.com",
      name: "Test User",
      nonce,
      spidCode: "test-spid-code",
      sub: "user-123",
    },
    protectedHeader: { alg: "RS256" },
  });
}

async function startOIDCSession() {
  const response = await app.inject({ method: "GET", url: "/auth/oidc/start" });

  const setCookieHeader = response.headers["set-cookie"] as string;
  const startUrl = new URL(response.headers["location"] ?? "");
  const nonce = startUrl.searchParams.get("nonce");
  const state = startUrl.searchParams.get("state");
  const encodedCookie = setCookieHeader.split(";").at(0)?.split("=").at(1);

  if (!encodedCookie || !nonce || !state) {
    throw new Error("Invalid OIDC session start response");
  }

  return { cookie: decodeURIComponent(encodedCookie), nonce, state };
}

// Redis connects eagerly and `consume` fails open until it's up, so poll with
// throwaway keys until the limiter reports a non-degraded status.
async function waitForHealthyLimiter(
  rateLimiter: RateLimiter,
  logger: Parameters<RateLimiter["consume"]>[1],
): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const status = await rateLimiter.consume(
      hashRateLimitKey(`warmup-${attempt}`),
      logger,
    );
    if (!status.degraded) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Redis rate limiter did not become healthy");
}
