import { generateId } from "@knodia/common-models/ids";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getConsumerKeychainPurposeMock = vi.hoisted(() => vi.fn());
const getConsumerKeychainKeyByKeyIdMock = vi.hoisted(() => vi.fn());
const getConsumerKeychainMock = vi.hoisted(() => vi.fn());
const getOrganizationMock = vi.hoisted(() => vi.fn());

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
      getConsumerKeychain: getConsumerKeychainMock,
      getConsumerKeychainKeyByKeyId: getConsumerKeychainKeyByKeyIdMock,
      getConsumerKeychainPurpose: getConsumerKeychainPurposeMock,
    },
  };
});

vi.mock("@knodia/organization-process-client", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@knodia/organization-process-client")
    >();

  return {
    ...original,
    organizationProcessApi: {
      ...original.organizationProcessApi,
      getOrganization: getOrganizationMock,
    },
  };
});

// Must import after vi.mock
import { injectRequest } from "./utils.ts";

const mockKeychainId = generateId();
const mockKid = "test-kid-123";
const mockPurposeId = generateId();

const mockKeychainResponse = {
  data: {
    createdAt: "2026-01-01T00:00:00.000Z",
    id: mockKeychainId,
    name: { en: "Test Keychain" },
    ownerId: generateId(),
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
};

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

const mockPurposeResponse = {
  data: {
    consumerKeychainId: mockKeychainId,
    linkedAt: "2026-01-01T00:00:00.000Z",
    purpose: { id: mockPurposeId, knodeId: "Lynx" },
  },
};

const mockOrganization = {
  data: {
    attributes: [{ code: "nuts1", scheme: "vc_territorial_units" }],
    id: mockKeychainResponse.data.ownerId,
    name: "Test Organization",
  },
};

beforeEach(() => {
  getConsumerKeychainPurposeMock.mockReset();
  getConsumerKeychainKeyByKeyIdMock.mockReset();
  getConsumerKeychainMock.mockReset();
  getOrganizationMock.mockReset();
});

describe("POST /consumerKeychains/:keychainId/accessTokenData (getAccessTokenData)", () => {
  const makeRequest = () =>
    injectRequest()
      .post(`/consumerKeychains/${mockKeychainId}/accessTokenData`)
      .payload({ kid: mockKid, purposeId: mockPurposeId });

  it("should return 200 with public key and consumer attributes on success", async () => {
    getConsumerKeychainPurposeMock.mockResolvedValue(mockPurposeResponse);
    getConsumerKeychainKeyByKeyIdMock.mockResolvedValue(mockKeyResponse);
    getConsumerKeychainMock.mockResolvedValue(mockKeychainResponse);
    getOrganizationMock.mockResolvedValue({ data: mockOrganization.data });

    const response = await makeRequest();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      consumerAttributes: mockOrganization.data.attributes,
      publicKey: {
        algorithm: "RS256",
        encodedPem: "dGVzdC1wZW0=",
        format: "jwk",
        kid: mockKid,
      },
    });
  });

  it("should call keychain-process with correct parameters", async () => {
    getConsumerKeychainPurposeMock.mockResolvedValue(mockPurposeResponse);
    getConsumerKeychainKeyByKeyIdMock.mockResolvedValue(mockKeyResponse);
    getConsumerKeychainMock.mockResolvedValue(mockKeychainResponse);
    getOrganizationMock.mockResolvedValue({ data: mockOrganization.data });

    await makeRequest();

    expect(getConsumerKeychainPurposeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: {
          consumerKeychainId: mockKeychainId,
          purposeId: mockPurposeId,
        },
        query: { knodeId: "Lynx" },
      }),
    );

    expect(getConsumerKeychainKeyByKeyIdMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: {
          consumerKeychainId: mockKeychainId,
          keyId: mockKid,
        },
      }),
    );

    expect(getConsumerKeychainMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { consumerKeychainId: mockKeychainId },
      }),
    );

    expect(getOrganizationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { organizationId: mockKeychainResponse.data.ownerId },
      }),
    );
  });

  it("should return 404 when purpose is not linked to keychain", async () => {
    getConsumerKeychainPurposeMock.mockRejectedValue({
      response: { status: 404 },
    });
    getConsumerKeychainKeyByKeyIdMock.mockResolvedValue(mockKeyResponse);
    getConsumerKeychainMock.mockResolvedValue(mockKeychainResponse);

    const response = await makeRequest();
    expect(response.statusCode).toBe(500);
  });

  it("should return 404 when key is not found", async () => {
    getConsumerKeychainPurposeMock.mockResolvedValue(mockPurposeResponse);
    getConsumerKeychainKeyByKeyIdMock.mockRejectedValue({
      response: { status: 404 },
    });
    getConsumerKeychainMock.mockResolvedValue(mockKeychainResponse);

    const response = await makeRequest();
    expect(response.statusCode).toBe(500);
  });

  it("should return 404 when keychain is not found", async () => {
    getConsumerKeychainPurposeMock.mockResolvedValue(mockPurposeResponse);
    getConsumerKeychainKeyByKeyIdMock.mockResolvedValue(mockKeyResponse);
    getConsumerKeychainMock.mockRejectedValue({
      response: { status: 404 },
    });

    const response = await makeRequest();
    expect(response.statusCode).toBe(500);
  });

  it("should return 400 for invalid request body", async () => {
    const response = await injectRequest()
      .post(`/consumerKeychains/${mockKeychainId}/accessTokenData`)
      .payload({ invalid: "body" });

    expect(response.statusCode).toBe(400);
  });
});
