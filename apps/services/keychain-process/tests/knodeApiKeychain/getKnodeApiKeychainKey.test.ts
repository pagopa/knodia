/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { KnodeApiKeychain } from "@knodia/keychain-models";
import type { API_KeychainKey } from "@knodia/keychain-models/api";

import {
  generateId,
  generateUserId,
  type KeyId,
  type KnodeApiKeychainId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import {
  forbiddenTestTokens,
  TEST_USER_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockKeychainKey,
  getMockKnodeApiKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { toAPI_KeychainKey } from "../../src/models/apiConverter.ts";
import { injectAppRequest, seedKnodeApiKeychain } from "../utils.ts";

const existingKeys = [
  { ...getMockKeychainKey(0), createdAt: new Date(1) },
  { ...getMockKeychainKey(1), createdAt: new Date(2) },
];

const knodeApiKeychain: KnodeApiKeychain = {
  ...getMockKnodeApiKeychain(),
  keys: existingKeys,
  // TEST_USER_ID is a member, so the download check (admin OR member) passes.
  users: [{ addedAt: new Date(), userId: TEST_USER_ID }],
};

const requestedKey = existingKeys[0]!;
const VALID_KNODE_API_KEYCHAIN_ID = knodeApiKeychain.id;
const VALID_KEY_ID = requestedKey.kid;
const NON_EXISTENT_KNODE_API_KEYCHAIN_ID = generateId<KnodeApiKeychainId>();
const NON_EXISTENT_KEY_ID = unsafeBrandKeyId("non-existent-key-id");

const allowedTestTokens: TestToken[] = [
  { type: "internal" },
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

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
    "should return the Knode API keychain key for an internal, member or admin caller ($type, $roles)",
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

  it("should return the same key as the list endpoint", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const uiToken: TestToken = {
      organizationId: knodeApiKeychain.ownerId,
      roles: ["administrative"],
      type: "ui-session",
    };
    const listResponse = await injectAppRequest(uiToken)
      .get(`/knodeApiKeychains/${VALID_KNODE_API_KEYCHAIN_ID}/keys`)
      .query({ limit: "50", offset: "0" });

    const listBody = listResponse.json<{ results: API_KeychainKey[] }>();

    const expectedItem = listBody.results.find(
      (key) => key.kid === VALID_KEY_ID,
    );

    const response = await getKnodeApiKeychainKey(
      VALID_KNODE_API_KEYCHAIN_ID,
      VALID_KEY_ID,
    );
    const body = response.json<API_KeychainKey>();

    expect(body).toEqual(expectedItem!);
  });

  it("should allow an internal (k2k) caller regardless of membership", async () => {
    const keychainWithoutCaller: KnodeApiKeychain = {
      ...knodeApiKeychain,
      users: [{ addedAt: new Date(), userId: generateUserId() }],
    };
    await seedKnodeApiKeychain(keychainWithoutCaller);

    const response = await getKnodeApiKeychainKey(
      keychainWithoutCaller.id,
      VALID_KEY_ID,
      { type: "internal" },
    );

    expect(response.statusCode).toBe(200);
  });

  it("should allow an administrative caller that is not a keychain member", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await getKnodeApiKeychainKey(
      VALID_KNODE_API_KEYCHAIN_ID,
      VALID_KEY_ID,
      {
        roles: ["administrative"],
        type: "ui-session",
        userId: generateUserId(),
      },
    );

    expect(response.statusCode).toBe(200);
  });

  it("should return 403 for a technical caller that is not a keychain member", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await getKnodeApiKeychainKey(
      VALID_KNODE_API_KEYCHAIN_ID,
      VALID_KEY_ID,
      { roles: ["technical"], type: "ui-session", userId: generateUserId() },
    );

    expect(response.statusCode).toBe(403);
  });

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
