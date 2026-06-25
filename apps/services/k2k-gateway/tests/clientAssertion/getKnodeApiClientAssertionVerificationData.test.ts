import {
  generateId,
  type KnodeApiKeychainId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { makeAxiosError } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getKnodeApiKeychainKeyMock = vi.hoisted(() => vi.fn());
const getKnodeApiKeychainMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/token-generator/refreshable", () => ({
  refreshableInternalTokenGenerator: () => ({
    get: vi.fn().mockResolvedValue({
      serialized: "mock-internal-token",
    }),
  }),
}));

vi.mock("@knodia/keychain-process-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/keychain-process-client")>();

  return {
    ...original,
    keychainProcessApi: {
      ...original.keychainProcessApi,
      getKnodeApiKeychain: getKnodeApiKeychainMock,
      getKnodeApiKeychainKey: getKnodeApiKeychainKeyMock,
    },
  };
});

// Must import after vi.mock
import { injectRequest } from "../utils.ts";

const mockKeychainId = generateId<KnodeApiKeychainId>();
const mockKid = "test-kid-123";
const mockOwnerId = generateId<OrganizationId>();

const mockKeyResponse = {
  data: {
    algorithm: "RS256",
    createdAt: "2026-01-01T00:00:00.000Z",
    encodedPem: "dGVzdC1wZW0=",
    format: "jwk",
    kid: mockKid,
    name: { en: "Test Key" },
    userId: generateId(),
  },
};

const mockKeychainResponse = {
  data: {
    createdAt: "2026-01-01T00:00:00.000Z",
    description: { en: "Test description" },
    id: mockKeychainId,
    name: { en: "Test Keychain" },
    ownerId: mockOwnerId,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
};

const makeRequestBody = () => ({
  keychainId: mockKeychainId,
  kid: mockKid,
});

beforeEach(() => {
  getKnodeApiKeychainKeyMock.mockReset();
  getKnodeApiKeychainMock.mockReset();
});

describe("POST /knodeApiClientAssertionVerificationData (getKnodeApiClientAssertionVerificationData)", () => {
  const makeRequest = (body = makeRequestBody()) =>
    injectRequest()
      .post("/knodeApiClientAssertionVerificationData")
      .payload(body);

  it("should return 200 with public key and owner id on success", async () => {
    getKnodeApiKeychainKeyMock.mockResolvedValue(mockKeyResponse);
    getKnodeApiKeychainMock.mockResolvedValue(mockKeychainResponse);

    const response = await makeRequest();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ownerId: mockOwnerId,
      publicKey: {
        algorithm: "RS256",
        encodedPem: "dGVzdC1wZW0=",
        format: "jwk",
        kid: mockKid,
      },
    });
  });

  it("should call keychain-process with correct parameters", async () => {
    getKnodeApiKeychainKeyMock.mockResolvedValue(mockKeyResponse);
    getKnodeApiKeychainMock.mockResolvedValue(mockKeychainResponse);

    await makeRequest();

    expect(getKnodeApiKeychainKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: {
          keyId: mockKid,
          knodeApiKeychainId: mockKeychainId,
        },
      }),
    );
    expect(getKnodeApiKeychainMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { knodeApiKeychainId: mockKeychainId },
      }),
    );
  });

  it("should return 404 when key is not found", async () => {
    getKnodeApiKeychainKeyMock.mockRejectedValue(
      makeAxiosError(404, "Key Not Found in Keychain"),
    );
    getKnodeApiKeychainMock.mockResolvedValue(mockKeychainResponse);

    const response = await makeRequest();
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 when keychain is not found via key endpoint", async () => {
    getKnodeApiKeychainKeyMock.mockRejectedValue(
      makeAxiosError(404, "Knode API Keychain Not Found"),
    );
    getKnodeApiKeychainMock.mockResolvedValue(mockKeychainResponse);

    const response = await makeRequest();
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 when keychain is not found via keychain endpoint", async () => {
    getKnodeApiKeychainKeyMock.mockResolvedValue(mockKeyResponse);
    getKnodeApiKeychainMock.mockRejectedValue(
      makeAxiosError(404, "Knode API Keychain Not Found"),
    );

    const response = await makeRequest();
    expect(response.statusCode).toBe(404);
  });

  it.each([
    { body: {}, testCase: "empty body" },
    {
      body: { keychainId: mockKeychainId },
      testCase: "missing kid",
    },
    {
      body: { kid: mockKid },
      testCase: "missing keychainId",
    },
    {
      body: {
        keychainId: "not-a-uuid",
        kid: mockKid,
      },
      testCase: "invalid keychainId",
    },
    {
      body: {
        extra: "field",
        keychainId: mockKeychainId,
        kid: mockKid,
      },
      testCase: "extra property",
    },
  ])(
    "should return 400 for invalid request body: $testCase",
    async ({ body }) => {
      const response = await makeRequest(body as never);

      expect(response.statusCode).toBe(400);
    },
  );
});
