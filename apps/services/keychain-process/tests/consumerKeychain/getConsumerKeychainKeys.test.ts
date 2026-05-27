/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ConsumerKeychain, KeychainKey } from "@knodia/keychain-models";
import type z from "zod";

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

import {
  type API_GetConsumerKeychainKeysQueryParams,
  API_KeychainKeys,
} from "../../src/models/api.ts";
import { toAPI_KeychainKey } from "../../src/models/apiConverter.ts";
import { injectAppRequest, seedConsumerKeychain } from "../utils.ts";

const existingKeys = Array.from({ length: 10 }, (_, i) => ({
  ...getMockKeychainKey(i),
  createdAt: new Date(i + 1),
})).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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

const defaultQuery = { limit: "4", offset: "0" };

const getConsumerKeychainKeys = ({
  consumerKeychainId = VALID_CONSUMER_KEYCHAIN_ID,
  query: { limit, offset } = defaultQuery,
  token = {
    ...allowedTestTokens[0]!,
    organizationId: consumerKeychain.ownerId,
  },
}: {
  consumerKeychainId?: ConsumerKeychainId;
  query?: { limit: string; offset: string };
  token?: TestToken;
} = {}) =>
  injectAppRequest(token).get(
    `/consumerKeychains/${consumerKeychainId}/keys?limit=${limit}&offset=${offset}`,
  );

describe("GET /consumerKeychains/:consumerKeychainId/keys (getConsumerKeychainKeys)", () => {
  it.each([
    {
      consumerKeychain,
      expectedResult: existingKeys.slice(0, 4),
      query: defaultQuery,
      testCase: "pagination only (1st page), sort by createdAt desc by default",
      totalCount: existingKeys.length,
    },
    {
      consumerKeychain,
      expectedResult: existingKeys.slice(4, 8),
      query: { ...defaultQuery, offset: "4" },
      testCase: "pagination only (2nd page), sort by createdAt desc by default",
      totalCount: existingKeys.length,
    },
    {
      consumerKeychain,
      expectedResult: [],
      query: { ...defaultQuery, offset: "10" },
      testCase:
        "offset exceeds existing keys, sort by createdAt desc by default",
      totalCount: existingKeys.length,
    },
    {
      consumerKeychain: {
        ...consumerKeychain,
        keys: [],
      },
      expectedResult: [],
      query: defaultQuery,
      testCase: "Consumer Keychain with zero keys",
      totalCount: 0,
    },
  ] satisfies {
    consumerKeychain: ConsumerKeychain;
    expectedResult: KeychainKey[];
    query: z.input<typeof API_GetConsumerKeychainKeysQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return Consumer Keychain keys with correct shape and pagination: $testCase (seed #%#)",
    async ({ consumerKeychain, expectedResult, query, totalCount }) => {
      await seedConsumerKeychain(consumerKeychain);

      const response = await getConsumerKeychainKeys({
        query,
      });

      expect(response.statusCode).toBe(200);
      expect(API_KeychainKeys.parse(response.json())).toEqual(
        expect.objectContaining({
          pagination: {
            limit: Number(query.limit),
            offset: Number(query.offset),
            total: totalCount,
          },
          results: expectedResult.map((e) => toAPI_KeychainKey(e)),
        }),
      );
    },
  );

  it.each(allowedTestTokens)(
    "should return the consumer keychain keys paginated with correct shape ($type, $roles)",
    async (token) => {
      await seedConsumerKeychain(consumerKeychain);

      const response = await getConsumerKeychainKeys({
        token: {
          ...token,
          organizationId: consumerKeychain.ownerId,
        },
      });

      expect(response.statusCode).toBe(200);
    },
  );

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await getConsumerKeychainKeys({
      token: {
        ...allowedTestTokens[0]!,
        organizationId: generateId<OrganizationId>(),
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getConsumerKeychainKeys({
        token,
      });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent consumer keychain id", async () => {
    const response = await getConsumerKeychainKeys({
      consumerKeychainId: NON_EXISTENT_CONSUMER_KEYCHAIN_ID,
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await getConsumerKeychainKeys({
      consumerKeychainId: "not-a-uuid" as never,
    });

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid pagination params", async () => {
    const response = await getConsumerKeychainKeys({
      query: { limit: "0", offset: "-1" },
    });

    expect(response.statusCode).toBe(400);
  });
});
