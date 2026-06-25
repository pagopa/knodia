import type { JtiReplayStore } from "@knodia/db-jti-replay-store";
import type {
  RateLimiter,
  RateLimiterStatus,
} from "@knodia/fastify-zod-api-commons/rate-limit";
import type { TokenGenerator } from "@knodia/token-generator";

import { requestContext } from "@fastify/request-context";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockVerifyAgainstJwksSets = vi.hoisted(() => vi.fn());
vi.mock("@knodia/fastify-zod-api-commons/auth", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@knodia/fastify-zod-api-commons/auth")
  >()),
  verifyAgainstJwksSets: (...args: unknown[]) =>
    mockVerifyAgainstJwksSets(...args),
}));

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => "mock-jwks"),
  jwtVerify: vi.fn(),
}));

import type { CognitoIdmClient } from "@knodia/cognito-idm-client";

import type { BffProcessConfig } from "../src/config/config.ts";

import { authServiceBuilder } from "../src/services/authService.ts";

const TEST_ORG_ID = "20000000-2000-1000-8000-000000000002";
const TEST_USER_ID = "10000000-1000-1000-8000-000000000001";
const AGREEMENT_ID = "40000000-4000-1000-8000-000000000004";
const CONSUMER_ID = "50000000-5000-1000-8000-000000000005";
const ESERVICE_ID = "60000000-6000-1000-8000-000000000006";
const ESERVICE_VERSION_ID = "70000000-7000-1000-8000-000000000007";
const PRODUCER_ID = "80000000-8000-1000-8000-000000000008";

const baseConfig = {
  acceptedAudiences: ["test-aud"],
  cognitoIssuer: "test-iss",
  cognitoJwksUrl: "http://localhost:0/cognito/.well-known/jwks.json",
  externalUiSessionJwt: {
    audience: "ext-aud",
    issuer: "ext-iss",
    kid: "alias/test",
    secondsDuration: 300,
  },
  externalUiSessionMagicLinkAccepted: {
    audience: "magic-aud",
    issuer: "magic-iss",
    wellKnownUrls: ["http://localhost:0/.well-known/jwks.json"],
  },
  refreshJwt: { secondsDuration: 86400 },
  uiSessionJwt: {
    audience: "test-aud",
    issuer: "test-iss",
    kid: "alias/test",
    secondsDuration: 3600,
  },
  wellKnownUrls: ["http://localhost:0/.well-known/jwks.json"],
} as unknown as BffProcessConfig;

function buildService(
  overrides: {
    magicLinkConsume?: (jti: string, exp: number) => Promise<boolean>;
    rateLimiterConsume?: () => Promise<RateLimiterStatus>;
    refreshConsume?: (jti: string, exp: number) => Promise<boolean>;
  } = {},
) {
  const rateLimiter: RateLimiter = {
    consume: vi.fn(
      overrides.rateLimiterConsume ??
        (async () => ({
          degraded: false,
          limitReached: false,
          maxRequests: 200,
          remainingRequests: 199,
          resetMs: 60_000,
        })),
    ),
    disconnect: vi.fn(),
  };
  const refreshTokenStore: JtiReplayStore = {
    close: vi.fn(async () => undefined),
    consume: vi.fn(overrides.refreshConsume ?? (async () => true)),
    revoke: vi.fn(async () => undefined),
  };
  const magicLinkTokenStore: JtiReplayStore = {
    close: vi.fn(async () => undefined),
    consume: vi.fn(overrides.magicLinkConsume ?? (async () => true)),
    revoke: vi.fn(async () => undefined),
  };
  const tokenGenerator: TokenGenerator = {
    generateExternalUISessionToken: vi.fn(async () => ({
      serialized: "ext-token",
    })),
    generateUIRefreshToken: vi.fn(async () => ({ serialized: "refresh" })),
    generateUISessionToken: vi.fn(async () => ({ serialized: "ui-token" })),
  } as unknown as TokenGenerator;

  const cognitoIdmClient = {
    getUserByUsername: vi.fn(async () => ({
      email: "test-user@example.com",
      enabled: true,
      id: TEST_USER_ID,
      roles: ["administrative", "technical"],
      username: "test-user",
    })),
  } as unknown as CognitoIdmClient;

  const service = authServiceBuilder({
    cognitoIdmClient,
    config: baseConfig,
    magicLinkTokenStore,
    rateLimiter,
    refreshTokenStore,
    tokenGenerator,
  });
  return { magicLinkTokenStore, rateLimiter, refreshTokenStore, service };
}

function makeMagicLinkPayload(jti: string): Record<string, unknown> {
  return {
    agreement: { id: AGREEMENT_ID, knode_id: "Lynx" },
    aud: "magic-aud",
    consumer: { id: CONSUMER_ID, knode_id: "Orion" },
    eservice: {
      id: ESERVICE_ID,
      knode_id: "Lynx",
      version: ESERVICE_VERSION_ID,
    },
    exp: Math.floor(Date.now() / 1000) + 300,
    iat: Math.floor(Date.now() / 1000),
    iss: "magic-iss",
    jti,
    producer: { id: PRODUCER_ID, knode_id: "Lynx" },
    scope: "agreement-activation",
    sub: AGREEMENT_ID,
    type: "external-ui-session-magic-link",
  };
}

function makeRefreshPayload(jti: string): Record<string, unknown> {
  return {
    aud: "test-aud",
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
    iss: "test-iss",
    jti,
    organizationId: TEST_ORG_ID,
    roles: ["administrative", "technical"],
    sub: TEST_USER_ID,
    type: "refresh-ui-session",
    username: "test-user",
  };
}

// authService's inline rate-limit reads logger/correlationId from request
// context; no Fastify request here, so feed them via a spy.
beforeEach(() => {
  const stubLogger = {
    child: () => stubLogger,
    debug: () => undefined,
    error: () => undefined,
    fatal: () => undefined,
    info: () => undefined,
    level: "silent",
    silent: () => undefined,
    trace: () => undefined,
    warn: () => undefined,
  };
  vi.spyOn(requestContext, "get").mockImplementation((key) => {
    if (key === "logger") return stubLogger as never;
    if (key === "correlationId") {
      return "00000000-0000-4000-8000-000000000000" as never;
    }
    return undefined;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("replay protection: consume runs before rate-limit", () => {
  it("refreshUISessionTokenPair: a replay never touches the rate-limiter", async () => {
    mockVerifyAgainstJwksSets.mockResolvedValue(
      makeRefreshPayload("replay-jti"),
    );
    const { rateLimiter, refreshTokenStore, service } = buildService({
      refreshConsume: async () => false,
    });

    await expect(
      service.refreshUISessionTokenPair("captured-jwt"),
    ).rejects.toMatchObject({
      errors: [{ code: "UNAUTHORIZED" }],
    });

    expect(refreshTokenStore.consume).toHaveBeenCalledOnce();
    expect(rateLimiter.consume).not.toHaveBeenCalled();
  });

  it("refreshUISessionTokenPair: a fresh refresh hits both store and rate-limit, in order", async () => {
    mockVerifyAgainstJwksSets.mockResolvedValue(
      makeRefreshPayload("fresh-jti"),
    );
    const { rateLimiter, refreshTokenStore, service } = buildService();

    await service.refreshUISessionTokenPair("legit-jwt");

    expect(refreshTokenStore.consume).toHaveBeenCalledOnce();
    expect(rateLimiter.consume).toHaveBeenCalledOnce();
    const [storeOrder] = (refreshTokenStore.consume as ReturnType<typeof vi.fn>)
      .mock.invocationCallOrder;
    const [limiterOrder] = (rateLimiter.consume as ReturnType<typeof vi.fn>)
      .mock.invocationCallOrder;
    if (storeOrder === undefined || limiterOrder === undefined) {
      throw new Error(
        "invocationCallOrder missing despite toHaveBeenCalledOnce",
      );
    }
    expect(storeOrder).toBeLessThan(limiterOrder);
  });

  it("exchangeMagicLinkToken: a replay never touches the rate-limiter", async () => {
    mockVerifyAgainstJwksSets.mockResolvedValue(
      makeMagicLinkPayload("replay-magic"),
    );
    const { magicLinkTokenStore, rateLimiter, service } = buildService({
      magicLinkConsume: async () => false,
    });

    await expect(
      service.exchangeMagicLinkToken("captured-magic"),
    ).rejects.toMatchObject({ errors: [{ code: "UNAUTHORIZED" }] });

    expect(magicLinkTokenStore.consume).toHaveBeenCalledOnce();
    expect(rateLimiter.consume).not.toHaveBeenCalled();
  });
});

describe("revokeRefreshToken: always tombstones, never rate-limits", () => {
  it("tombstones the JTI on a valid refresh", async () => {
    mockVerifyAgainstJwksSets.mockResolvedValue(
      makeRefreshPayload("revoke-jti"),
    );
    const { rateLimiter, refreshTokenStore, service } = buildService();

    await service.revokeRefreshToken("legit-jwt");

    expect(refreshTokenStore.revoke).toHaveBeenCalledOnce();
    // Logout intentionally bypasses the inline rate-limit: a 429 would leak
    // the JTI for the rest of its TTL. See authService.revokeRefreshToken.
    expect(rateLimiter.consume).not.toHaveBeenCalled();
  });

  it("silently no-ops on signature verification failure", async () => {
    mockVerifyAgainstJwksSets.mockRejectedValue(new Error("bad signature"));
    const { rateLimiter, refreshTokenStore, service } = buildService();

    await service.revokeRefreshToken("forged-jwt");

    expect(refreshTokenStore.revoke).not.toHaveBeenCalled();
    expect(rateLimiter.consume).not.toHaveBeenCalled();
  });
});
