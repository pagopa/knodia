/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ProducerKeychain } from "@knodia/keychain-models";
import type { API_KeychainKey } from "@knodia/keychain-models/api";

import {
  generateId,
  generateUserId,
  type ProducerKeychainId,
} from "@knodia/common-models/ids";
import {
  forbiddenTestTokens,
  TEST_USER_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockKeychainKey,
  getMockProducerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { toAPI_KeychainKey } from "../../src/models/apiConverter.ts";
import { injectAppRequest, seedProducerKeychain } from "../utils.ts";

const existingKeys = [
  { ...getMockKeychainKey(0), createdAt: new Date(1) },
  { ...getMockKeychainKey(1), createdAt: new Date(2) },
];

const producerKeychain: ProducerKeychain = {
  ...getMockProducerKeychain(),
  keys: existingKeys,
  // TEST_USER_ID is a member, so the download check (admin OR member) passes.
  users: [{ addedAt: new Date(), userId: TEST_USER_ID }],
};

const requestedKey = existingKeys[0]!;
const VALID_PRODUCER_KEYCHAIN_ID = producerKeychain.id;
const VALID_KEY_ID = requestedKey.kid;
const NON_EXISTENT_PRODUCER_KEYCHAIN_ID = generateId<ProducerKeychainId>();
const NON_EXISTENT_KEY_ID = "non-existent-key-id";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getProducerKeychainKey = (
  producerKeychainId: string,
  keyId: string,
  token: TestToken = allowedTestTokens[0]!,
) =>
  injectAppRequest(token).get(
    `/producerKeychains/${producerKeychainId}/keys/${keyId}`,
  );

describe("GET /producerKeychains/:producerKeychainId/keys/:keyId (getProducerKeychainKey)", () => {
  it.each(allowedTestTokens)(
    "should return the producer keychain key for a member or admin caller ($type, $roles)",
    async (token) => {
      await seedProducerKeychain(producerKeychain);

      const response = await getProducerKeychainKey(
        VALID_PRODUCER_KEYCHAIN_ID,
        VALID_KEY_ID,
        token,
      );

      expect(response.statusCode).toBe(200);

      const body = response.json<API_KeychainKey>();
      expect(body).toEqual(toAPI_KeychainKey(requestedKey));
    },
  );

  it("should return the same key as the list endpoint", async () => {
    await seedProducerKeychain(producerKeychain);

    const uiToken: TestToken = {
      organizationId: producerKeychain.ownerId,
      roles: ["administrative"],
      type: "ui-session",
    };
    const listResponse = await injectAppRequest(uiToken)
      .get(`/producerKeychains/${VALID_PRODUCER_KEYCHAIN_ID}/keys`)
      .query({ limit: "50", offset: "0" });

    const listBody = listResponse.json<{ results: API_KeychainKey[] }>();

    const expectedItem = listBody.results.find(
      (key) => key.kid === VALID_KEY_ID,
    );

    const response = await getProducerKeychainKey(
      VALID_PRODUCER_KEYCHAIN_ID,
      VALID_KEY_ID,
    );
    const body = response.json<API_KeychainKey>();

    expect(body).toEqual(expectedItem!);
  });

  it("should allow an administrative caller that is not a keychain member", async () => {
    await seedProducerKeychain(producerKeychain);

    const response = await getProducerKeychainKey(
      VALID_PRODUCER_KEYCHAIN_ID,
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
    await seedProducerKeychain(producerKeychain);

    const response = await getProducerKeychainKey(
      VALID_PRODUCER_KEYCHAIN_ID,
      VALID_KEY_ID,
      { roles: ["technical"], type: "ui-session", userId: generateUserId() },
    );

    expect(response.statusCode).toBe(403);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getProducerKeychainKey(
        VALID_PRODUCER_KEYCHAIN_ID,
        VALID_KEY_ID,
        token,
      );

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent producer keychain id", async () => {
    await seedProducerKeychain(producerKeychain);

    const response = await getProducerKeychainKey(
      NON_EXISTENT_PRODUCER_KEYCHAIN_ID,
      VALID_KEY_ID,
    );

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 for non-existent key id", async () => {
    await seedProducerKeychain(producerKeychain);

    const response = await getProducerKeychainKey(
      VALID_PRODUCER_KEYCHAIN_ID,
      NON_EXISTENT_KEY_ID,
    );

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await getProducerKeychainKey("not-a-uuid", VALID_KEY_ID);

    expect(response.statusCode).toBe(400);
  });
});
