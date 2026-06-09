/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockKeychainKey, makeAxiosError } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProducerKeyMock = vi.hoisted(() => vi.fn());

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
      getProducerKey: getProducerKeyMock,
    },
  };
});

import type { keychainProcessApi } from "@knodia/keychain-process-client";

import { injectAppRequest } from "../utils.ts";

const NON_EXISTENT_KEY_ID = "non-existent-key-id";
const mockKeychainKey: keychainProcessApi.PublicKey = getMockKeychainKey(0);
const mockPublicKey: keychainProcessApi.PublicKey = {
  algorithm: mockKeychainKey.algorithm,
  encodedPem: mockKeychainKey.encodedPem,
  format: mockKeychainKey.format,
  kid: mockKeychainKey.kid,
};
const VALID_KEY_ID = mockKeychainKey.kid;

const allowedTestTokens: TestToken[] = [{ type: "knode-api" }];

const getProducerKey = ({
  keyId = VALID_KEY_ID,
  token = allowedTestTokens[0]!,
}: {
  keyId?: string;
  token?: TestToken;
} = {}) => injectAppRequest(token).get(`/producerKeys/${keyId}`);

beforeEach(() => {
  getProducerKeyMock.mockReset();
});

describe("GET /producerKeys/:keyId (getProducerPublicKey)", () => {
  it.each(allowedTestTokens)(
    "should return producer public key ($type, $roles)",
    async (token) => {
      getProducerKeyMock.mockResolvedValue({ data: mockPublicKey });

      const response = await getProducerKey({ token });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockPublicKey);
    },
  );

  it("should call keychain-process with correct path params", async () => {
    getProducerKeyMock.mockResolvedValue({ data: mockPublicKey });

    await getProducerKey();

    expect(getProducerKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { keyId: VALID_KEY_ID },
      }),
    );
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getProducerKey({ token });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent key id", async () => {
    getProducerKeyMock.mockRejectedValue(
      makeAxiosError(404, "Producer Public Key not found"),
    );

    const response = await getProducerKey({ keyId: NON_EXISTENT_KEY_ID });

    expect(response.statusCode).toBe(404);
  });
});
