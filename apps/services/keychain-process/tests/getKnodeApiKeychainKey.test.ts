/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { KnodeApiKeychain } from "@knodia/keychain-models";

import {
  generateId,
  type KeyId,
  type KnodeApiKeychainId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockKeychainKey,
  getMockKnodeApiKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_KeychainKey } from "../src/models/api.ts";

import { toAPI_KeychainKey } from "../src/models/apiConverter.ts";
import { injectAppRequest, seedKnodeApiKeychain } from "./utils.ts";

const existingKeys = [
  { ...getMockKeychainKey(0), createdAt: new Date(1) },
  { ...getMockKeychainKey(1), createdAt: new Date(2) },
];

const knodeApiKeychain: KnodeApiKeychain = {
  ...getMockKnodeApiKeychain(),
  keys: existingKeys,
};

const requestedKey = existingKeys[0]!;
const VALID_KNODE_API_KEYCHAIN_ID = knodeApiKeychain.id;
const VALID_KEY_ID = requestedKey.kid;
const NON_EXISTENT_KNODE_API_KEYCHAIN_ID = generateId<KnodeApiKeychainId>();
const NON_EXISTENT_KEY_ID = unsafeBrandKeyId("non-existent-key-id");

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

const getKnodeApiKeychainKey = (
  knodeApiKeychainId: KnodeApiKeychainId,
  keyId: KeyId,
  token: TestToken = allowedTestTokens[0]!,
) =>
  injectAppRequest(token).get(
    `/knodeApiKeychains/${knodeApiKeychainId}/keys/${keyId}`,
  );

describe("GET /knodeApiKeychains/:knodeApiKeychainId/keys/:keyId (getKnodeApiKeychainKey)", () => {
  it.each(allowedTestTokens)(
    "should return the Knode API keychain key with correct shape ($type, $roles)",
    async (token) => {
      await seedKnodeApiKeychain(knodeApiKeychain);

      const response = await getKnodeApiKeychainKey(
        VALID_KNODE_API_KEYCHAIN_ID,
        VALID_KEY_ID,
        token,
      );

      expect(response.statusCode).toBe(200);

      const body = response.json<API_KeychainKey>();
      expect(body).toEqual(toAPI_KeychainKey(requestedKey));
    },
  );

  // TODO: re-enable this test once the list endpoint is implemented
  // eslint-disable-next-line vitest/no-commented-out-tests
  // it("should return the same key as the list endpoint", async () => {
  // });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getKnodeApiKeychainKey(
        VALID_KNODE_API_KEYCHAIN_ID,
        VALID_KEY_ID,
        token,
      );

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent Knode API keychain id", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await getKnodeApiKeychainKey(
      NON_EXISTENT_KNODE_API_KEYCHAIN_ID,
      VALID_KEY_ID,
    );

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 for non-existent key id", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await getKnodeApiKeychainKey(
      VALID_KNODE_API_KEYCHAIN_ID,
      NON_EXISTENT_KEY_ID,
    );

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid Knode API keychain id format", async () => {
    const response = await getKnodeApiKeychainKey(
      "not-a-uuid" as never,
      VALID_KEY_ID,
    );

    expect(response.statusCode).toBe(400);
  });
});
