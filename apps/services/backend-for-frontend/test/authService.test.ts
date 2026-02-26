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

const tokenGenerator = tokenGeneratorBuilder();

vi.mock("../src/config/config.ts", () => ({
  config: {
    cognitoIssuer: "https://cognito-idp.eu-west-1.amazonaws.com/pool-id",
    cognitoJwksUrl:
      "https://cognito-idp.eu-west-1.amazonaws.com/pool-id/.well-known/jwks.json",
    uiSessionJwt: {
      audience: "test-audience",
      issuer: "test-issuer",
      kid: "alias/test-kid",
      secondsDuration: 3600,
    },
  },
}));

const TEST_USER_ID = "10000000-1000-1000-8000-000000000001";
const TEST_ORG_ID = "20000000-2000-1000-8000-000000000002";

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

function setupValidCognitoToken(
  payloadOverrides: Record<string, unknown> = {},
) {
  mockJwtVerify.mockResolvedValue({
    payload: makeCognitoPayload(payloadOverrides),
    protectedHeader: { alg: "RS256" },
  });
}

describe("authService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generateUISessionToken", () => {
    it("generates a valid JWT string when given a valid Cognito token", async () => {
      setupValidCognitoToken();
      mockKmsSend.mockResolvedValue({
        Signature: new Uint8Array([1, 2, 3, 4]),
      });

      const service = authServiceBuilder(tokenGenerator);
      const token = await service.generateUISessionToken("valid-cognito-token");

      const parts = token.split(".");
      expect(parts).toHaveLength(3);

      const [headerPart, payloadPart] = parts;
      const header = JSON.parse(
        Buffer.from(headerPart ?? "", "base64url").toString(),
      );
      expect(header).toEqual({
        alg: "RS256",
        kid: "alias/test-kid",
        typ: "at+jwt",
        use: "sig",
      });

      const payload = JSON.parse(
        Buffer.from(payloadPart ?? "", "base64url").toString(),
      );
      expect(payload.sub).toBe(TEST_USER_ID);
      expect(payload.organizationId).toBe(TEST_ORG_ID);
      expect(payload.roles).toEqual(["administrative", "technical"]);
      expect(payload.aud).toBe("test-audience");
      expect(payload.iss).toBe("test-issuer");
      expect(payload.type).toBe("ui-session");
      expect(payload.exp).toBeGreaterThan(payload.iat);
      expect(payload.jti).toBeDefined();
    });

    it("calls KMS with the correct key alias and signing algorithm", async () => {
      setupValidCognitoToken();
      mockKmsSend.mockResolvedValue({
        Signature: new Uint8Array([5, 6, 7, 8]),
      });

      const service = authServiceBuilder(tokenGenerator);
      await service.generateUISessionToken("token");

      expect(mockKmsSend).toHaveBeenCalledOnce();
      const sendArg = mockKmsSend.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(sendArg).toMatchObject({
        KeyId: "alias/test-kid",
        SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
      });
    });

    it("throws unauthorized when Cognito JWT verification fails", async () => {
      mockJwtVerify.mockRejectedValue(new Error("Invalid signature"));

      const service = authServiceBuilder(tokenGenerator);

      await expect(
        service.generateUISessionToken("bad-token"),
      ).rejects.toThrow();
    });

    it("throws unauthorized when cognito:groups is missing", async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { sub: TEST_USER_ID },
        protectedHeader: { alg: "RS256" },
      });

      const service = authServiceBuilder(tokenGenerator);

      await expect(
        service.generateUISessionToken("token-no-groups"),
      ).rejects.toThrow();
    });

    it("throws unauthorized when no org: group is present", async () => {
      setupValidCognitoToken({
        "cognito:groups": ["role:administrative"],
      });

      const service = authServiceBuilder(tokenGenerator);

      await expect(
        service.generateUISessionToken("token-no-org"),
      ).rejects.toThrow();
    });

    it("throws unauthorized when no role: group is present", async () => {
      setupValidCognitoToken({
        "cognito:groups": [`org:${TEST_ORG_ID}`],
      });

      const service = authServiceBuilder(tokenGenerator);

      await expect(
        service.generateUISessionToken("token-no-roles"),
      ).rejects.toThrow();
    });

    it("throws unauthorized when role is not a valid UserRole value", async () => {
      setupValidCognitoToken({
        "cognito:groups": [`org:${TEST_ORG_ID}`, "role:invalidrole"],
      });

      const service = authServiceBuilder(tokenGenerator);

      await expect(
        service.generateUISessionToken("token-bad-role"),
      ).rejects.toThrow();
    });

    it("throws unauthorized when KMS returns no signature", async () => {
      setupValidCognitoToken();
      mockKmsSend.mockResolvedValue({ Signature: undefined });

      const service = authServiceBuilder(tokenGenerator);

      await expect(service.generateUISessionToken("token")).rejects.toThrow();
    });

    it("extracts org ID by stripping the 'org:' prefix", async () => {
      const customOrgId = "30000000-3000-1000-8000-000000000003";
      setupValidCognitoToken({
        "cognito:groups": [`org:${customOrgId}`, "role:technical"],
      });
      mockKmsSend.mockResolvedValue({
        Signature: new Uint8Array([1]),
      });

      const service = authServiceBuilder(tokenGenerator);
      const token = await service.generateUISessionToken("token");

      const payload = JSON.parse(
        Buffer.from(token.split(".")[1] ?? "", "base64url").toString(),
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
      mockKmsSend.mockResolvedValue({
        Signature: new Uint8Array([1]),
      });

      const service = authServiceBuilder(tokenGenerator);
      const token = await service.generateUISessionToken("token");

      const payload = JSON.parse(
        Buffer.from(token.split(".")[1] ?? "", "base64url").toString(),
      );
      expect(payload.roles).toEqual(["administrative"]);
      expect(payload.organizationId).toBe(TEST_ORG_ID);
    });
  });
});
