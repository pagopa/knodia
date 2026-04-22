/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  UISessionRefreshTokenClaims,
  UISessionTokenClaims,
} from "@knodia/common-models/auth";
import { afterEach, describe, expect, it, vi } from "vitest";

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

import { app } from "./setup.ts";

const TEST_USER_ID = "10000000-1000-1000-8000-000000000001";
const TEST_ORG_ID = "20000000-2000-1000-8000-000000000002";

function getSetCookie(
  response: { headers: { "set-cookie"?: string | string[] } },
  name: string,
): Record<string, string> | undefined {
  const raw = response.headers["set-cookie"];
  const headers = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const header = headers.find((h) => h.startsWith(`${name}=`));
  if (!header) return undefined;

  const [nameValue, ...attrParts] = header.split(";").map((p) => p.trim());
  const result: Record<string, string> = {
    value: nameValue!.slice(name.length + 1),
  };
  for (const attr of attrParts) {
    const eqIndex = attr.indexOf("=");
    if (eqIndex === -1) {
      result[attr.toLowerCase()] = "true";
    } else {
      result[attr.slice(0, eqIndex).trim().toLowerCase()] = attr
        .slice(eqIndex + 1)
        .trim();
    }
  }
  return result;
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
    username: "test-user",
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
    username: "test-user",
    ...overrides,
  };
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
      expect(uiPayload.username).toBe("test-user");
      expect(uiPayload.type).toBe("ui-session");
    });

    it("sets HttpOnly refresh cookie on successful login", async () => {
      setupValidCognitoToken();
      setupKmsSignature();

      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "valid-cognito-token" },
        url: "/auth/ui-session",
      });

      const refreshCookie = getSetCookie(response, "refresh");
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie!["value"]).toBeTruthy();
      expect(refreshCookie!["httponly"]).toBe("true");
      expect(refreshCookie!["samesite"]).toBe("Strict");
      expect(refreshCookie!["path"]).toBe("/auth");

      const refreshPayload = UISessionRefreshTokenClaims.parse(
        parseJwtPayload(refreshCookie!["value"]!),
      );
      expect(refreshPayload.sub).toBe(TEST_USER_ID);
      expect(refreshPayload.username).toBe("test-user");
      expect(refreshPayload.type).toBe("refresh-ui-session");
    });

    it("calls KMS with the correct key alias and signing algorithm", async () => {
      setupValidCognitoToken();
      setupKmsSignature();

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
    });

    it("returns 401 when Cognito JWT verification fails", async () => {
      mockJwtVerify.mockRejectedValue(new Error("Invalid signature"));

      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "bad-token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when cognito:groups is missing", async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { sub: TEST_USER_ID },
        protectedHeader: { alg: "RS256" },
      });

      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when no org: group is present", async () => {
      setupValidCognitoToken({ "cognito:groups": ["role:administrative"] });

      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when no valid role: group is present", async () => {
      setupValidCognitoToken({
        "cognito:groups": [`org:${TEST_ORG_ID}`, "role:invalidrole"],
      });

      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when username is missing from Cognito token", async () => {
      mockJwtVerify.mockResolvedValue({
        payload: {
          "cognito:groups": [`org:${TEST_ORG_ID}`, "role:administrative"],
          sub: TEST_USER_ID,
        },
        protectedHeader: { alg: "RS256" },
      });

      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns error when KMS returns no signature", async () => {
      setupValidCognitoToken();
      mockKmsSend.mockResolvedValue({ Signature: undefined });

      const response = await app.inject({
        method: "POST",
        payload: { oidcToken: "token" },
        url: "/auth/ui-session",
      });

      expect(response.statusCode).toBe(500);
    });

    it("extracts org ID by stripping the 'org:' prefix", async () => {
      const customOrgId = "30000000-3000-1000-8000-000000000003";
      setupValidCognitoToken({
        "cognito:groups": [`org:${customOrgId}`, "role:technical"],
      });
      setupKmsSignature();

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
    });
  });

  // --- Refresh ---

  describe("POST /auth/ui-session/refresh", () => {
    it("reads refresh token from cookie and returns new session", async () => {
      setupValidRefreshToken();
      setupKmsSignature();

      const response = await app.inject({
        cookies: { refresh: "valid-refresh-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(200);

      const body = response.json<{ uiSessionToken: string }>();
      expect(body.uiSessionToken).toBeDefined();

      const uiPayload = UISessionTokenClaims.parse(
        parseJwtPayload(body.uiSessionToken),
      );
      expect(uiPayload.username).toBe("test-user");

      // Should set a new refresh cookie (rotation)
      const refreshCookie = getSetCookie(response, "refresh");
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie!["httponly"]).toBe("true");
    });

    it("returns 401 when no refresh cookie is present", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when refresh token verification fails", async () => {
      mockJwtVerify.mockRejectedValue(new Error("Invalid signature"));

      const response = await app.inject({
        cookies: { refresh: "bad-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when refresh token has invalid claims", async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { sub: TEST_USER_ID, type: "refresh-ui-session" },
        protectedHeader: { alg: "RS256" },
      });

      const response = await app.inject({
        cookies: { refresh: "jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when refresh token has wrong type", async () => {
      setupValidRefreshToken({ type: "ui-session" });

      const response = await app.inject({
        cookies: { refresh: "jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when the same refresh token is used twice (replay)", async () => {
      const fixedJti = "replay-test-jti";
      setupValidRefreshToken({ jti: fixedJti });
      setupKmsSignature();

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
    });

    it("allows different refresh tokens with distinct JTIs", async () => {
      setupKmsSignature();

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
    });

    it("succeeds when one of multiple JWKS sets validates the refresh token", async () => {
      mockJwtVerify
        .mockRejectedValueOnce(new Error("key not found"))
        .mockResolvedValueOnce({
          payload: makeRefreshPayload(),
          protectedHeader: { alg: "RS256" },
        });
      setupKmsSignature();

      const response = await app.inject({
        cookies: { refresh: "refresh-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(200);
    });

    it("returns 401 when all JWKS sets fail to validate the refresh token", async () => {
      mockJwtVerify
        .mockRejectedValueOnce(new Error("key not found"))
        .mockRejectedValueOnce(new Error("invalid signature"));

      const response = await app.inject({
        cookies: { refresh: "bad-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      expect(response.statusCode).toBe(401);
    });

    it("validates refresh token against all JWKS sets in parallel", async () => {
      setupValidRefreshToken();
      setupKmsSignature();

      await app.inject({
        cookies: { refresh: "refresh-jwt" },
        method: "POST",
        url: "/auth/ui-session/refresh",
      });

      // With 2 wellKnownUrls, jwtVerify should be called for both JWKS sets
      expect(mockJwtVerify).toHaveBeenCalledTimes(2);
    });

    it("preserves claims from the refresh token in the new pair", async () => {
      const customOrgId = "30000000-3000-1000-8000-000000000003";
      setupValidRefreshToken({
        organizationId: customOrgId,
        roles: ["technical"],
      });
      setupKmsSignature();

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
    });
  });

  // --- Logout ---

  describe("POST /auth/logout", () => {
    it("clears the refresh cookie", async () => {
      mockDecodeJwt.mockReturnValue(makeRefreshPayload());

      const response = await app.inject({
        cookies: { refresh: "some-refresh-jwt" },
        method: "POST",
        url: "/auth/logout",
      });

      expect(response.statusCode).toBe(204);

      const refreshCookie = getSetCookie(response, "refresh");
      expect(refreshCookie).toBeDefined();
      // Cookie cleared: empty value and Max-Age=0
      expect(refreshCookie!["value"]).toBe("");
      expect(refreshCookie!["max-age"]).toBe("0");
      expect(refreshCookie!["httponly"]).toBe("true");
      expect(refreshCookie!["path"]).toBe("/auth");
    });

    it("revokes the refresh token JTI in the token store", async () => {
      const jti = `revoke-test-${crypto.randomUUID()}`;
      mockDecodeJwt.mockReturnValue(makeRefreshPayload({ jti }));

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
    });

    it("succeeds even without a refresh cookie", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/logout",
      });

      expect(response.statusCode).toBe(204);
    });
  });

  // --- Magic-link token exchange ---

  describe("POST /auth/externalUiSession", () => {
    const AGREEMENT_ID = "40000000-4000-1000-8000-000000000004";
    const CONSUMER_ID = "50000000-5000-1000-8000-000000000005";
    const ESERVICE_ID = "60000000-6000-1000-8000-000000000006";
    const ESERVICE_VERSION_ID = "70000000-7000-1000-8000-000000000007";
    const PRODUCER_ID = "80000000-8000-1000-8000-000000000008";

    function makeMagicLinkPayload(
      overrides: Record<string, unknown> = {},
    ): Record<string, unknown> {
      return {
        agreementId: AGREEMENT_ID,
        aud: "test-magic-link-audience",
        consumerId: CONSUMER_ID,
        consumerKnodeId: "Orion",
        eserviceId: ESERVICE_ID,
        eserviceVersionId: ESERVICE_VERSION_ID,
        exp: Math.floor(Date.now() / 1000) + 120,
        iat: Math.floor(Date.now() / 1000),
        iss: "test-issuer",
        jti: crypto.randomUUID(),
        producerId: PRODUCER_ID,
        scope: "agreement-activation",
        sub: AGREEMENT_ID,
        type: "external-ui-session-magic-link",
        ...overrides,
      };
    }

    function setupValidMagicLinkToken(overrides: Record<string, unknown> = {}) {
      mockJwtVerify.mockResolvedValue({
        payload: makeMagicLinkPayload(overrides),
        protectedHeader: { alg: "RS256" },
      });
    }

    it("returns an external-ui-session token when the magic-link token is valid", async () => {
      setupValidMagicLinkToken();
      setupKmsSignature();

      const response = await app.inject({
        method: "POST",
        payload: { magicLinkToken: "valid.magic.link" },
        url: "/auth/externalUiSession",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{
        agreementId: string;
        externalUiSessionToken: string;
      }>();
      expect(body.agreementId).toBe(AGREEMENT_ID);
      expect(body.externalUiSessionToken).toBeDefined();
      expect(body.externalUiSessionToken.split(".")).toHaveLength(3);

      const payload = parseJwtPayload(body.externalUiSessionToken) as Record<
        string,
        unknown
      >;
      expect(payload["type"]).toBe("external-ui-session");
      expect(payload["agreementId"]).toBe(AGREEMENT_ID);
      expect(payload["consumerId"]).toBe(CONSUMER_ID);
      expect(payload["consumerKnodeId"]).toBe("Orion");
      expect(payload["eserviceId"]).toBe(ESERVICE_ID);
      expect(payload["eserviceVersionId"]).toBe(ESERVICE_VERSION_ID);
      expect(payload["producerId"]).toBe(PRODUCER_ID);
      expect(payload["scope"]).toBe("agreement-activation");
      expect(payload["sub"]).toBe(AGREEMENT_ID);
    });

    it("does not set a refresh cookie (one-shot session)", async () => {
      setupValidMagicLinkToken();
      setupKmsSignature();

      const response = await app.inject({
        method: "POST",
        payload: { magicLinkToken: "valid.magic.link" },
        url: "/auth/externalUiSession",
      });

      const refreshCookie = getSetCookie(response, "refresh");
      expect(refreshCookie).toBeUndefined();
    });

    it("returns 401 when the magic-link JWT verification fails", async () => {
      mockJwtVerify.mockRejectedValue(new Error("Invalid signature"));

      const response = await app.inject({
        method: "POST",
        payload: { magicLinkToken: "bad.token" },
        url: "/auth/externalUiSession",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when the claims parse fails", async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { foo: "bar" },
        protectedHeader: { alg: "RS256" },
      });

      const response = await app.inject({
        method: "POST",
        payload: { magicLinkToken: "malformed-claims" },
        url: "/auth/externalUiSession",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when the scope is wrong", async () => {
      setupValidMagicLinkToken({ scope: "other-scope" });

      const response = await app.inject({
        method: "POST",
        payload: { magicLinkToken: "wrong-scope" },
        url: "/auth/externalUiSession",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 on replay (same jti twice)", async () => {
      const jti = crypto.randomUUID();
      setupValidMagicLinkToken({ jti });
      setupKmsSignature();

      const first = await app.inject({
        method: "POST",
        payload: { magicLinkToken: "valid.magic.link" },
        url: "/auth/externalUiSession",
      });
      expect(first.statusCode).toBe(200);

      setupValidMagicLinkToken({ jti });

      const second = await app.inject({
        method: "POST",
        payload: { magicLinkToken: "replay.magic.link" },
        url: "/auth/externalUiSession",
      });
      expect(second.statusCode).toBe(401);
    });

    it("returns 400 when request body is missing magicLinkToken", async () => {
      const response = await app.inject({
        method: "POST",
        payload: {},
        url: "/auth/externalUiSession",
      });
      expect(response.statusCode).toBe(400);
    });
  });
});
