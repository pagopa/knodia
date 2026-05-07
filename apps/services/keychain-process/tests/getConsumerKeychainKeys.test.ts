/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ConsumerKeychain } from "@knodia/keychain-models";

import {
  type ConsumerKeychainId,
  generateId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockConsumerKeychain,
  getMockKeychainKey,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { API_KeychainKeys } from "../src/models/api.ts";
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

const VALID_CONSUMER_KEYCHAIN_ID = consumerKeychain.id;
const NON_EXISTENT_CONSUMER_KEYCHAIN_ID = generateId<ConsumerKeychainId>();

const allowedTestTokens: Extract<TestToken, { type: "ui-session" }>[] = [
  { roles: ["technical"], type: "ui-session" },
  { roles: ["administrative"], type: "ui-session" },
];

const getConsumerKeychainKeys = (
  consumerKeychainId: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
  token: TestToken = {
    ...allowedTestTokens[0]!,
    organizationId: consumerKeychain.ownerId,
  },
) =>
  injectAppRequest(token).get(
    `/consumerKeychains/${consumerKeychainId}/keys?limit=${limit}&offset=${offset}`,
  );

describe("GET /consumerKeychains/:consumerKeychainId/keys (getConsumerKeychainKeys)", () => {
  it.each(allowedTestTokens)(
    "should return the consumer keychain keys paginated with correct shape ($type, $roles)",
    async (token) => {
      await seedConsumerKeychain(consumerKeychain);

      const response = await getConsumerKeychainKeys(
        VALID_CONSUMER_KEYCHAIN_ID,
        { limit: 1, offset: 0 },
        {
          ...token,
          organizationId: consumerKeychain.ownerId,
        },
      );

      expect(response.statusCode).toBe(200);
      expect(API_KeychainKeys.parse(response.json())).toEqual(
        expect.objectContaining({
          pagination: {
            limit: 1,
            offset: 0,
            total: existingKeys.length,
          },
          results: [toAPI_KeychainKey(existingKeys[1]!)],
        }),
      );
    },
  );

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await getConsumerKeychainKeys(
      VALID_CONSUMER_KEYCHAIN_ID,
      undefined,
      {
        ...allowedTestTokens[0]!,
        organizationId: generateId<OrganizationId>(),
      },
    );

    expect(response.statusCode).toBe(403);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getConsumerKeychainKeys(
        VALID_CONSUMER_KEYCHAIN_ID,
        undefined,
        token,
      );

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent consumer keychain id", async () => {
    const response = await getConsumerKeychainKeys(
      NON_EXISTENT_CONSUMER_KEYCHAIN_ID,
      undefined,
    );

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await getConsumerKeychainKeys("not-a-uuid", undefined);

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid pagination params", async () => {
    const response = injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: consumerKeychain.ownerId,
    }).get(
      `/consumerKeychains/${VALID_CONSUMER_KEYCHAIN_ID}/keys?limit=0&offset=-1`,
    );

    expect((await response).statusCode).toBe(400);
  });
});
