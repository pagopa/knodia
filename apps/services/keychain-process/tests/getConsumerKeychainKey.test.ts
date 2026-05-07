/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ConsumerKeychain } from "@knodia/keychain-models";

import { type ConsumerKeychainId, generateId } from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockConsumerKeychain,
  getMockKeychainKey,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_KeychainKey } from "../src/models/api.ts";

import { toAPI_KeychainKey } from "../src/models/apiConverter.ts";
import { injectAppRequest, seedConsumerKeychain } from "./utils.ts";

const existingKeys = [
  { ...getMockKeychainKey(0), createdAt: new Date(1) },
  { ...getMockKeychainKey(1), createdAt: new Date(2) },
];

const consumerKeychain: ConsumerKeychain = {
  ...getMockConsumerKeychain(),
  keys: existingKeys,
};

const requestedKey = existingKeys[0]!;
const VALID_CONSUMER_KEYCHAIN_ID = consumerKeychain.id;
const VALID_KEY_ID = requestedKey.kid;
const NON_EXISTENT_CONSUMER_KEYCHAIN_ID = generateId<ConsumerKeychainId>();
const NON_EXISTENT_KEY_ID = "non-existent-key-id";

const allowedTestTokens: TestToken[] = [
  { type: "internal" },
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getConsumerKeychainKey = (
  consumerKeychainId: string,
  keyId: string,
  token: TestToken = allowedTestTokens[0]!,
) =>
  injectAppRequest(token).get(
    `/consumerKeychains/${consumerKeychainId}/keys/${keyId}`,
  );

describe("GET /consumerKeychains/:consumerKeychainId/keys/:keyId (getConsumerKeychainKey)", () => {
  it.each(allowedTestTokens)(
    "should return the consumer keychain key with correct shape ($type, $roles)",
    async (token) => {
      await seedConsumerKeychain(consumerKeychain);

      const response = await getConsumerKeychainKey(
        VALID_CONSUMER_KEYCHAIN_ID,
        VALID_KEY_ID,
        token,
      );

      expect(response.statusCode).toBe(200);

      const body = response.json<API_KeychainKey>();
      expect(body).toEqual(toAPI_KeychainKey(requestedKey));
    },
  );

  it("should return the same key as the list endpoint", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const uiToken: TestToken = {
      organizationId: consumerKeychain.ownerId,
      roles: ["administrative"],
      type: "ui-session",
    };
    const listResponse = await injectAppRequest(uiToken)
      .get(`/consumerKeychains/${VALID_CONSUMER_KEYCHAIN_ID}/keys`)
      .query({ limit: "50", offset: "0" });

    const listBody = listResponse.json<{ results: API_KeychainKey[] }>();

    const expectedItem = listBody.results.find(
      (key) => key.kid === VALID_KEY_ID,
    );

    const response = await getConsumerKeychainKey(
      VALID_CONSUMER_KEYCHAIN_ID,
      VALID_KEY_ID,
    );
    const body = response.json<API_KeychainKey>();

    expect(body).toEqual(expectedItem!);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getConsumerKeychainKey(
        VALID_CONSUMER_KEYCHAIN_ID,
        VALID_KEY_ID,
        token,
      );

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent consumer keychain id", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await getConsumerKeychainKey(
      NON_EXISTENT_CONSUMER_KEYCHAIN_ID,
      VALID_KEY_ID,
    );

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 for non-existent key id", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await getConsumerKeychainKey(
      VALID_CONSUMER_KEYCHAIN_ID,
      NON_EXISTENT_KEY_ID,
    );

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await getConsumerKeychainKey("not-a-uuid", VALID_KEY_ID);

    expect(response.statusCode).toBe(400);
  });
});
