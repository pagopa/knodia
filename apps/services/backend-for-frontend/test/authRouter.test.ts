/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { afterEach, describe, expect, it, vi } from "vitest";

import { type RefreshTokenStore } from "../src/services/refreshTokenStore.ts";

const mockJwtVerify = vi.hoisted(() => vi.fn());
const mockDecodeJwt = vi.hoisted(() => vi.fn());
const mockKmsSend = vi.hoisted(() => vi.fn());
const mockRefreshTokenStore = vi.hoisted(() => ({
  current: undefined as RefreshTokenStore | undefined,
}));
const createMockRefreshTokenStore = vi.hoisted(
  (): (() => RefreshTokenStore) => () => {
    const consumed = new Set<string>();
    return {
      consume(jti: string): Promise<boolean> {
        if (consumed.has(jti)) return Promise.resolve(false);
        consumed.add(jti);
        return Promise.resolve(true);
      },
      revoke(jti: string): Promise<void> {
        consumed.add(jti);
        return Promise.resolve();
      },
    };
  },
);

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn().mockReturnValue("mock-jwks"),
  decodeJwt: (...args: unknown[]) => mockDecodeJwt(...args),
  jwtVerify: mockJwtVerify,
}));

vi.mock("@aws-sdk/client-kms", () => ({
  KMSClient: function MockKMSClient() {
    return { send: mockKmsSend };
  },
  SignCommand: function MockSignCommand(
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    return { ...input };
  },
}));

vi.mock("../src/services/refreshTokenStore.ts", () => ({
  createRefreshTokenStore: () =>
    mockRefreshTokenStore.current ?? createMockRefreshTokenStore(),
}));

vi.mock("../src/config/config.ts", () => ({
  config: {
    acceptedAudiences: ["test-audience"],
    cognitoIssuer: "https://cognito-idp.eu-west-1.amazonaws.com/pool-id",
    cognitoJwksUrl:
      "https://cognito-idp.eu-west-1.amazonaws.com/pool-id/.well-known/jwks.json",
    cookie: {
      domain: undefined,
      secure: false,
    },
    host: "0.0.0.0",
    logLevel: "silent",
    port: 0,
    redisUrl: "redis://localhost:6379",
    refreshJwt: {
      secondsDuration: 86400,
    },
    uiSessionJwt: {
      audience: "test-audience",
      issuer: "test-issuer",
      kid: "alias/test-kid",
      secondsDuration: 3600,
    },
    wellKnownUrls: ["http://localhost:4500/knodia/.well-known/jwks.json"],
  },
}));

const TEST_USER_ID = "10000000-1000-1000-8000-000000000001";
const TEST_ORG_ID = "20000000-2000-1000-8000-000000000002";

async function buildTestApp(store?: RefreshTokenStore) {
  mockRefreshTokenStore.current = store;
  const { buildAppFromConfig } = await import("../src/app.ts");
  const { config } = await import("../src/config/config.ts");
  const app = buildAppFromConfig(config);
  await app.ready();
  return app;
}

function makeCognitoPayload(): Record<string, unknown> {
  return {
    "cognito:groups": [`org:${TEST_ORG_ID}`, "role:administrative"],
    sub: TEST_USER_ID,
  };
}

function makeRefreshPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    aud: "test-audience",
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
    iss: "test-issuer",
    jti: crypto.randomUUID(),
    organizationId: TEST_ORG_ID,
    roles: ["administrative"],
    sub: TEST_USER_ID,
    type: "refresh-ui-session",
    ...overrides,
  };
}

function parseCookies(
  setCookieHeaders: string | string[] | undefined,
): Map<string, { attributes: Map<string, string>; value: string }> {
  const cookies = new Map<
    string,
    { attributes: Map<string, string>; value: string }
  >();
  const headers = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : setCookieHeaders
      ? [setCookieHeaders]
      : [];

  for (const header of headers) {
    const parts = header.split(";").map((p) => p.trim());
    const [nameValue, ...attrParts] = parts;
    if (!nameValue) continue;
    const eqIndex = nameValue.indexOf("=");
    const name = nameValue.slice(0, eqIndex);
    const value = nameValue.slice(eqIndex + 1);
    const attributes = new Map<string, string>();
    for (const attr of attrParts) {
      const [key, val] = attr.split("=").map((s) => s.trim());
      attributes.set(key!.toLowerCase(), val ?? "true");
    }
    cookies.set(name!, { attributes, value });
  }
  return cookies;
}

afterEach(() => {
  vi.clearAllMocks();
  mockRefreshTokenStore.current = undefined;
});

describe("POST /auth/ui-session", () => {
  it("sets HttpOnly refresh cookie on successful login", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: makeCognitoPayload(),
      protectedHeader: { alg: "RS256" },
    });
    mockKmsSend.mockResolvedValue({
      Signature: new Uint8Array([1, 2, 3, 4]),
    });

    const app = await buildTestApp();
    const response = await app.inject({
      method: "POST",
      payload: { oidcToken: "valid-cognito-token" },
      url: "/auth/ui-session",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{ uiSessionToken: string }>();
    expect(body.uiSessionToken).toBeDefined();
    // refreshToken must NOT be in the response body
    expect(body).not.toHaveProperty("refreshToken");

    const cookies = parseCookies(response.headers["set-cookie"]);
    const refreshCookie = cookies.get("refresh");
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie!.value).toBeTruthy();
    expect(refreshCookie!.attributes.get("httponly")).toBe("true");
    expect(refreshCookie!.attributes.get("samesite")).toBe("Strict");
    expect(refreshCookie!.attributes.get("path")).toBe("/auth");

    await app.close();
  });
});

describe("POST /auth/ui-session/refresh", () => {
  it("reads refresh token from cookie and returns new session", async () => {
    const refreshPayload = makeRefreshPayload();
    mockJwtVerify.mockResolvedValue({
      payload: refreshPayload,
      protectedHeader: { alg: "RS256" },
    });
    mockKmsSend.mockResolvedValue({
      Signature: new Uint8Array([1, 2, 3, 4]),
    });

    const app = await buildTestApp();
    const response = await app.inject({
      cookies: { refresh: "valid-refresh-jwt" },
      method: "POST",
      url: "/auth/ui-session/refresh",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{ uiSessionToken: string }>();
    expect(body.uiSessionToken).toBeDefined();

    // Should set a new refresh cookie (rotation)
    const cookies = parseCookies(response.headers["set-cookie"]);
    expect(cookies.get("refresh")).toBeDefined();
    expect(cookies.get("refresh")!.attributes.get("httponly")).toBe("true");

    await app.close();
  });

  it("returns 401 when no refresh cookie is present", async () => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/auth/ui-session/refresh",
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });
});

describe("POST /auth/logout", () => {
  it("clears the refresh cookie", async () => {
    mockDecodeJwt.mockReturnValue(makeRefreshPayload());

    const app = await buildTestApp();
    const response = await app.inject({
      cookies: { refresh: "some-refresh-jwt" },
      method: "POST",
      url: "/auth/logout",
    });

    expect(response.statusCode).toBe(204);

    const cookies = parseCookies(response.headers["set-cookie"]);
    const refreshCookie = cookies.get("refresh");
    expect(refreshCookie).toBeDefined();
    // Cookie cleared: empty value and Max-Age=0
    expect(refreshCookie!.value).toBe("");
    expect(refreshCookie!.attributes.get("max-age")).toBe("0");
    expect(refreshCookie!.attributes.get("httponly")).toBe("true");
    expect(refreshCookie!.attributes.get("path")).toBe("/auth");

    await app.close();
  });

  it("revokes the refresh token JTI in the store", async () => {
    const store = createMockRefreshTokenStore();
    const jti = "test-jti-to-revoke";
    mockDecodeJwt.mockReturnValue(makeRefreshPayload({ jti }));

    const app = await buildTestApp(store);
    await app.inject({
      cookies: { refresh: "jwt-with-jti" },
      method: "POST",
      url: "/auth/logout",
    });

    // After revoke, consuming the same JTI should fail
    const consumed = await store.consume(jti, 999999);
    expect(consumed).toBe(false);

    await app.close();
  });

  it("succeeds even without a refresh cookie", async () => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/auth/logout",
    });

    expect(response.statusCode).toBe(204);

    await app.close();
  });
});
