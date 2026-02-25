import type {
  RefreshTokenClaims,
  UISessionTokenClaims,
} from "@knodia/common-models/auth";

import { tokenGeneratorBuilder } from "@knodia/token-generator";
import { afterEach, describe, expect, it, vi } from "vitest";

import { authServiceBuilder } from "../src/services/authService.ts";

const mockJwtVerify = vi.hoisted(() => vi.fn());
const mockKmsSend = vi.hoisted(() => vi.fn());

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn().mockReturnValue("mock-jwks"),
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

vi.mock("../src/config/config.ts", () => ({
  config: {
    acceptedAudiences: ["test-audience"],
    cognitoIssuer: "https://cognito-idp.eu-west-1.amazonaws.com/pool-id",
    cognitoJwksUrl:
      "https://cognito-idp.eu-west-1.amazonaws.com/pool-id/.well-known/jwks.json",
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

const tokenGenerator = tokenGeneratorBuilder();

function buildService() {
  return authServiceBuilder(tokenGenerator);
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
    jti: "some-jti",
    organizationId: TEST_ORG_ID,
    roles: ["administrative", "technical"],
    sub: TEST_USER_ID,
    type: "refresh",
    ...overrides,
  };
}

function parseJwtPayload<T extends RefreshTokenClaims | UISessionTokenClaims>(
  jwt: string,
): T {
  return JSON.parse(
    Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString(),
  ) as T;
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

afterEach(() => {
  vi.clearAllMocks();
});

describe("generateTokenPair", () => {
  it("generates valid ui-session and refresh JWTs", async () => {
    setupValidCognitoToken();
    mockKmsSend.mockResolvedValue({
      Signature: new Uint8Array([1, 2, 3, 4]),
    });

    const service = buildService();
    const result = await service.generateTokenPair("valid-cognito-token");

    expect(result.uiSessionToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.uiSessionToken.split(".")).toHaveLength(3);
    expect(result.refreshToken.split(".")).toHaveLength(3);

    const uiPayload = parseJwtPayload<UISessionTokenClaims>(
      result.uiSessionToken,
    );
    expect(uiPayload.sub).toBe(TEST_USER_ID);
    expect(uiPayload.organizationId).toBe(TEST_ORG_ID);
    expect(uiPayload.roles).toEqual(["administrative", "technical"]);
    expect(uiPayload.type).toBe("ui-session");

    const refreshPayload = parseJwtPayload<RefreshTokenClaims>(
      result.refreshToken,
    );
    expect(refreshPayload.sub).toBe(TEST_USER_ID);
    expect(refreshPayload.type).toBe("refresh");
  });

  it("calls KMS with the correct key alias and signing algorithm", async () => {
    setupValidCognitoToken();
    mockKmsSend.mockResolvedValue({
      Signature: new Uint8Array([5, 6, 7, 8]),
    });

    const service = buildService();
    await service.generateTokenPair("token");

    expect(mockKmsSend).toHaveBeenCalledTimes(2);
    const sendArg = mockKmsSend.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sendArg).toMatchObject({
      KeyId: "alias/test-kid",
      SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
    });
  });

  it("throws unauthorized when Cognito JWT verification fails", async () => {
    mockJwtVerify.mockRejectedValue(new Error("Invalid signature"));

    const service = buildService();

    await expect(service.generateTokenPair("bad-token")).rejects.toThrow();
  });

  it("throws unauthorized when cognito:groups is missing", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: TEST_USER_ID },
      protectedHeader: { alg: "RS256" },
    });

    const service = buildService();

    await expect(
      service.generateTokenPair("token-no-groups"),
    ).rejects.toThrow();
  });

  it("throws unauthorized when no org: group is present", async () => {
    setupValidCognitoToken({
      "cognito:groups": ["role:administrative"],
    });

    const service = buildService();

    await expect(service.generateTokenPair("token-no-org")).rejects.toThrow();
  });

  it("throws unauthorized when no role: group is present", async () => {
    setupValidCognitoToken({
      "cognito:groups": [`org:${TEST_ORG_ID}`],
    });

    const service = buildService();

    await expect(service.generateTokenPair("token-no-roles")).rejects.toThrow();
  });

  it("throws unauthorized when role is not a valid UserRole value", async () => {
    setupValidCognitoToken({
      "cognito:groups": [`org:${TEST_ORG_ID}`, "role:invalidrole"],
    });

    const service = buildService();

    await expect(service.generateTokenPair("token-bad-role")).rejects.toThrow();
  });

  it("throws unauthorized when KMS returns no signature", async () => {
    setupValidCognitoToken();
    mockKmsSend.mockResolvedValue({ Signature: undefined });

    const service = buildService();

    await expect(service.generateTokenPair("token")).rejects.toThrow();
  });

  it("extracts org ID by stripping the 'org:' prefix", async () => {
    const customOrgId = "30000000-3000-1000-8000-000000000003";
    setupValidCognitoToken({
      "cognito:groups": [`org:${customOrgId}`, "role:technical"],
    });
    mockKmsSend.mockResolvedValue({ Signature: new Uint8Array([1]) });

    const service = buildService();
    const { uiSessionToken } = await service.generateTokenPair("token");
    expect(
      parseJwtPayload<UISessionTokenClaims>(uiSessionToken).organizationId,
    ).toBe(customOrgId);
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
    mockKmsSend.mockResolvedValue({ Signature: new Uint8Array([1]) });

    const service = buildService();
    const { uiSessionToken } = await service.generateTokenPair("token");
    const payload = parseJwtPayload<UISessionTokenClaims>(uiSessionToken);
    expect(payload.roles).toEqual(["administrative"]);
    expect(payload.organizationId).toBe(TEST_ORG_ID);
  });
});

describe("refreshTokenPair", () => {
  it("returns a new token pair from a valid refresh token", async () => {
    setupValidRefreshToken();
    mockKmsSend.mockResolvedValue({
      Signature: new Uint8Array([1, 2, 3, 4]),
    });

    const service = buildService();
    const result = await service.refreshTokenPair("valid-refresh-jwt");

    expect(result.uiSessionToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    const uiPayload = parseJwtPayload<UISessionTokenClaims>(
      result.uiSessionToken,
    );
    expect(uiPayload.sub).toBe(TEST_USER_ID);
    expect(uiPayload.organizationId).toBe(TEST_ORG_ID);
    expect(uiPayload.roles).toEqual(["administrative", "technical"]);
    expect(uiPayload.type).toBe("ui-session");

    const refreshPayload = parseJwtPayload<RefreshTokenClaims>(
      result.refreshToken,
    );
    expect(refreshPayload.sub).toBe(TEST_USER_ID);
    expect(refreshPayload.type).toBe("refresh");
  });

  it("throws when refresh token verification fails", async () => {
    mockJwtVerify.mockRejectedValue(new Error("Invalid signature"));
    const service = buildService();
    await expect(service.refreshTokenPair("bad-jwt")).rejects.toThrow();
  });

  it("throws when refresh token has invalid claims", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: TEST_USER_ID, type: "refresh" },
      protectedHeader: { alg: "RS256" },
    });
    const service = buildService();
    await expect(service.refreshTokenPair("jwt")).rejects.toThrow();
  });

  it("throws when refresh token has wrong type", async () => {
    setupValidRefreshToken({ type: "ui-session" });
    const service = buildService();
    await expect(service.refreshTokenPair("jwt")).rejects.toThrow();
  });

  it("preserves claims from the refresh token in the new pair", async () => {
    const customOrgId = "30000000-3000-1000-8000-000000000003";
    setupValidRefreshToken({
      organizationId: customOrgId,
      roles: ["technical"],
    });
    mockKmsSend.mockResolvedValue({ Signature: new Uint8Array([1]) });

    const service = buildService();
    const { uiSessionToken } = await service.refreshTokenPair("refresh-jwt");
    const payload = parseJwtPayload<UISessionTokenClaims>(uiSessionToken);
    expect(payload.organizationId).toBe(customOrgId);
    expect(payload.roles).toEqual(["technical"]);
  });
});
