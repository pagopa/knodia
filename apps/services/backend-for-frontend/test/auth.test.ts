/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  UISessionRefreshTokenClaims,
  UISessionTokenClaims,
} from "@knodia/common-models/auth";
import { afterEach, describe, expect, inject, it, vi } from "vitest";

const mockJwtVerify = vi.hoisted(() => vi.fn());
const mockDecodeJwt = vi.hoisted(() => vi.fn());
const mockKmsSend = vi.hoisted(() => vi.fn());

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

const TEST_USER_ID = "10000000-1000-1000-8000-000000000001";
const TEST_ORG_ID = "20000000-2000-1000-8000-000000000002";

vi.mock("../src/config/config.ts", () => ({
  get config() {
    return {
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
      redisUrl: inject("REDIS_CONNECTION_STRING"),
      refreshJwt: {
        secondsDuration: 86400,
      },
      uiSessionJwt: {
        audience: "test-audience",
        issuer: "test-issuer",
        kid: "alias/test-kid",
        secondsDuration: 3600,
      },
      wellKnownUrls: [
        "http://localhost:4500/knodia/.well-known/jwks.json",
        "http://localhost:4501/knodia/.well-known/jwks.json",
      ],
    };
  },
}));

async function buildTestApp() {
  const { buildAppFromConfig } = await import("../src/app.ts");
  const { config } = await import("../src/config/config.ts");
  const app = buildAppFromConfig(config);
  await app.ready();
  return app;
}

function makeCognitoPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    "cognito:groups": [
      `org:${TEST_ORG_ID}`,
      "role:administrative",
      "role:technical",
    ],
    sub: TEST_USER_ID,
    ...overrides,
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
    roles: ["administrative", "technical"],
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

function parseJwtPayload(jwt: string): unknown {
  return JSON.parse(
    Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString(),
  );
}

function setupKmsSignature() {
  mockKmsSend.mockResolvedValue({
    Signature: new Uint8Array([1, 2, 3, 4]),
  });
}

function setupValidCognitoToken(
  payloadOverrides: Record<string, unknown> = {},
) {
  mockJwtVerify.mockResolvedValue({
    payload: makeCognitoPayload(payloadOverrides),
    protectedHeader: { alg: "RS256" },
  });
}

function setupValidRefreshToken(overrides: Record<string, unknown> = {}) {
  mockJwtVerify.mockResolvedValue({
    payload: makeRefreshPayload(overrides),
    protectedHeader: { alg: "RS256" },
  });
}

describe("auth integration", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- Login ---

  describe("POST /auth/ui-session", () => {
    it("generates valid session and refresh tokens on successful login", async () => {
      setupValidCognitoToken();
      setupKmsSignature();

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "valid-cognito-token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<{ uiSessionToken: string }>();
      expect(body.uiSessionToken).toBeDefined();
      expect(body.uiSessionToken.split(".")).toHaveLength(3);
      // refreshToken must NOT be in the response body
      expect(body).not.toHaveProperty("refreshToken");

      const uiPayload = UISessionTokenClaims.parse(
        parseJwtPayload(body.uiSessionToken),
      );
      expect(uiPayload.sub).toBe(TEST_USER_ID);
      expect(uiPayload.organizationId).toBe(TEST_ORG_ID);
      expect(uiPayload.roles).toEqual(["administrative", "technical"]);
      expect(uiPayload.type).toBe("ui-session");

      await app.close();
    });

    it("sets HttpOnly refresh cookie on successful login", async () => {
      setupValidCognitoToken();
      setupKmsSignature();

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "valid-cognito-token" },
        url: "/auth/ui-session",
      });

      const cookies = parseCookies(response.headers["set-cookie"]);
      const refreshCookie = cookies.get("refresh");
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie!.value).toBeTruthy();
      expect(refreshCookie!.attributes.get("httponly")).toBe("true");
      expect(refreshCookie!.attributes.get("samesite")).toBe("Strict");
      expect(refreshCookie!.attributes.get("path")).toBe("/auth");

      const refreshPayload = UISessionRefreshTokenClaims.parse(
        parseJwtPayload(refreshCookie!.value),
      );
      expect(refreshPayload.sub).toBe(TEST_USER_ID);
      expect(refreshPayload.type).toBe("refresh-ui-session");

      await app.close();
    });

    it("calls KMS with the correct key alias and signing algorithm", async () => {
      setupValidCognitoToken();
      setupKmsSignature();

      const app = await buildTestApp();
      await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      expect(mockKmsSend).toHaveBeenCalledTimes(2);
      const sendArg = mockKmsSend.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(sendArg).toMatchObject({
        KeyId: "alias/test-kid",
        SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
      });

      await app.close();
    });

    it("returns 401 when Cognito JWT verification fails", async () => {
      mockJwtVerify.mockRejectedValue(new Error("Invalid signature"));

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "bad-token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });

    it("returns 401 when cognito:groups is missing", async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { sub: TEST_USER_ID },
        protectedHeader: { alg: "RS256" },
      });

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });

    it("returns 401 when no org: group is present", async () => {
      setupValidCognitoToken({ "cognito:groups": ["role:administrative"] });

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });

    it("returns 401 when no valid role: group is present", async () => {
      setupValidCognitoToken({
        "cognito:groups": [`org:${TEST_ORG_ID}`, "role:invalidrole"],
      });

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });

    it("returns error when KMS returns no signature", async () => {
      setupValidCognitoToken();
      mockKmsSend.mockResolvedValue({ Signature: undefined });

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(500);

      await app.close();
    });

    it("extracts org ID by stripping the 'org:' prefix", async () => {
      const customOrgId = "30000000-3000-1000-8000-000000000003";
      setupValidCognitoToken({
        "cognito:groups": [`org:${customOrgId}`, "role:technical"],
      });
      setupKmsSignature();

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      const body = response.json<{ uiSessionToken: string }>();
      const payload = UISessionTokenClaims.parse(
        parseJwtPayload(body.uiSessionToken),
      );
      expect(payload.organizationId).toBe(customOrgId);

      await app.close();
    });

    it("ignores groups that do not start with 'org:' or 'role:'", async () => {
      setupValidCognitoToken({
        "cognito:groups": [
          `org:${TEST_ORG_ID}`,
          "role:administrative",
          "team:frontend",
          "random-group",
        ],
      });
      setupKmsSignature();

      const app = await buildTestApp();
      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      const body = response.json<{ uiSessionToken: string }>();
      const uiPayload = UISessionTokenClaims.parse(
        parseJwtPayload(body.uiSessionToken),
      );
      expect(uiPayload.roles).toEqual(["administrative"]);
      expect(uiPayload.organizationId).toBe(TEST_ORG_ID);

      await app.close();
    });
  });

  // --- Refresh ---

  describe("POST /auth/ui-session/refresh", () => {
    it("reads refresh token from cookie and returns new session", async () => {
      setupValidRefreshToken();
      setupKmsSignature();

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

    it("returns 401 when refresh token verification fails", async () => {
      mockJwtVerify.mockRejectedValue(new Error("Invalid signature"));

      const app = await buildTestApp();
      const response = await app.inject({
        cookies: { refresh: "bad-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });

    it("returns 401 when refresh token has invalid claims", async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { sub: TEST_USER_ID, type: "refresh-ui-session" },
        protectedHeader: { alg: "RS256" },
      });

      const app = await buildTestApp();
      const response = await app.inject({
        cookies: { refresh: "jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });

    it("returns 401 when refresh token has wrong type", async () => {
      setupValidRefreshToken({ type: "ui-session" });

      const app = await buildTestApp();
      const response = await app.inject({
        cookies: { refresh: "jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });

    it("returns 401 when the same refresh token is used twice (replay)", async () => {
      const fixedJti = "replay-test-jti";
      setupValidRefreshToken({ jti: fixedJti });
      setupKmsSignature();

      const app = await buildTestApp();

      // First use succeeds
      const first = await app.inject({
        cookies: { refresh: "refresh-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });
      expect(first.statusCode).toBe(200);

      // Same JTI again — replay detected
      setupValidRefreshToken({ jti: fixedJti });
      const second = await app.inject({
        cookies: { refresh: "refresh-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });
      expect(second.statusCode).toBe(401);

      await app.close();
    });

    it("allows different refresh tokens with distinct JTIs", async () => {
      setupKmsSignature();

      const app = await buildTestApp();

      setupValidRefreshToken({ jti: "jti-1" });
      const first = await app.inject({
        cookies: { refresh: "refresh-jwt-1" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });
      expect(first.statusCode).toBe(200);

      setupValidRefreshToken({ jti: "jti-2" });
      const second = await app.inject({
        cookies: { refresh: "refresh-jwt-2" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });
      expect(second.statusCode).toBe(200);

      await app.close();
    });

    it("succeeds when one of multiple JWKS sets validates the refresh token", async () => {
      mockJwtVerify
        .mockRejectedValueOnce(new Error("key not found"))
        .mockResolvedValueOnce({
          payload: makeRefreshPayload(),
          protectedHeader: { alg: "RS256" },
        });
      setupKmsSignature();

      const app = await buildTestApp();
      const response = await app.inject({
        cookies: { refresh: "refresh-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(200);

      await app.close();
    });

    it("returns 401 when all JWKS sets fail to validate the refresh token", async () => {
      mockJwtVerify
        .mockRejectedValueOnce(new Error("key not found"))
        .mockRejectedValueOnce(new Error("invalid signature"));

      const app = await buildTestApp();
      const response = await app.inject({
        cookies: { refresh: "bad-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });

    it("validates refresh token against all JWKS sets in parallel", async () => {
      setupValidRefreshToken();
      setupKmsSignature();

      const app = await buildTestApp();
      await app.inject({
        cookies: { refresh: "refresh-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      // With 2 wellKnownUrls, jwtVerify should be called for both JWKS sets
      expect(mockJwtVerify).toHaveBeenCalledTimes(2);

      await app.close();
    });

    it("preserves claims from the refresh token in the new pair", async () => {
      const customOrgId = "30000000-3000-1000-8000-000000000003";
      setupValidRefreshToken({
        organizationId: customOrgId,
        roles: ["technical"],
      });
      setupKmsSignature();

      const app = await buildTestApp();
      const response = await app.inject({
        cookies: { refresh: "refresh-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      const { uiSessionToken } = response.json<{ uiSessionToken: string }>();
      const payload = UISessionTokenClaims.parse(
        parseJwtPayload(uiSessionToken),
      );
      expect(payload.organizationId).toBe(customOrgId);
      expect(payload.roles).toEqual(["technical"]);

      await app.close();
    });
  });

  // --- Logout ---

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

    it("revokes the refresh token JTI in Redis", async () => {
      const jti = `revoke-test-${crypto.randomUUID()}`;
      mockDecodeJwt.mockReturnValue(makeRefreshPayload({ jti }));

      const app = await buildTestApp();
      await app.inject({
        cookies: { refresh: "jwt-with-jti" },
        method: "POST",
        url: "/auth/logout",
      });

      // After logout, trying to refresh with the same JTI should fail
      setupValidRefreshToken({ jti });
      setupKmsSignature();
      const refreshResponse = await app.inject({
        cookies: { refresh: "refresh-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });
      expect(refreshResponse.statusCode).toBe(401);

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
});
