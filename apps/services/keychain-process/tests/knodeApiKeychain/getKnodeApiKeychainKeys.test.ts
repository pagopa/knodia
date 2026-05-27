/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { KeychainKey, KnodeApiKeychain } from "@knodia/keychain-models";
import type z from "zod";

import {
  generateId,
  type KnodeApiKeychainId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockKeychainKey,
  getMockKnodeApiKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  type API_GetKnodeApiKeychainKeysQueryParams,
  API_KeychainKeys,
} from "../../src/models/api.ts";
import { toAPI_KeychainKey } from "../../src/models/apiConverter.ts";
import { injectAppRequest, seedKnodeApiKeychain } from "../utils.ts";

const existingKeys = Array.from({ length: 10 }, (_, i) => ({
  ...getMockKeychainKey(i),
  createdAt: new Date(i + 1),
})).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

const knodeApiKeychain: KnodeApiKeychain = {
  ...getMockKnodeApiKeychain(),
  keys: existingKeys,
};

const VALID_KNODE_API_KEYCHAIN_ID = knodeApiKeychain.id;
const NON_EXISTENT_KNODE_API_KEYCHAIN_ID = generateId<KnodeApiKeychainId>();

const allowedTestTokens: Extract<TestToken, { type: "ui-session" }>[] = [
  { roles: ["technical"], type: "ui-session" },
  { roles: ["administrative"], type: "ui-session" },
];

const defaultQuery = { limit: "4", offset: "0" };

const getKnodeApiKeychainKeys = ({
  knodeApiKeychainId = VALID_KNODE_API_KEYCHAIN_ID,
  query: { limit, offset } = defaultQuery,
  token = {
    ...allowedTestTokens[0]!,
    organizationId: knodeApiKeychain.ownerId,
  },
}: {
  knodeApiKeychainId?: KnodeApiKeychainId;
  query?: { limit: string; offset: string };
  token?: TestToken;
} = {}) =>
  injectAppRequest(token)
    .get(`/knodeApiKeychains/${knodeApiKeychainId}/keys`)
    .query({
      limit,
      offset,
    });

describe("GET /knodeApiKeychains/:knodeApiKeychainId/keys (getKnodeApiKeychainKeys)", () => {
  it.each([
    {
      expectedResult: existingKeys.slice(0, 4),
      knodeApiKeychain,
      query: defaultQuery,
      testCase: "pagination only (1st page), sort by createdAt desc by default",
      totalCount: existingKeys.length,
    },
    {
      expectedResult: existingKeys.slice(4, 8),
      knodeApiKeychain,
      query: { ...defaultQuery, offset: "4" },
      testCase: "pagination only (2nd page), sort by createdAt desc by default",
      totalCount: existingKeys.length,
    },
    {
      expectedResult: [],
      knodeApiKeychain,
      query: { ...defaultQuery, offset: "10" },
      testCase:
        "offset exceeds existing keys, sort by createdAt desc by default",
      totalCount: existingKeys.length,
    },
    {
      expectedResult: [],
      knodeApiKeychain: {
        ...knodeApiKeychain,
        keys: [],
      },
      query: defaultQuery,
      testCase: "Knode API Keychain with zero keys",
      totalCount: 0,
    },
  ] satisfies {
    expectedResult: KeychainKey[];
    knodeApiKeychain: KnodeApiKeychain;
    query: z.input<typeof API_GetKnodeApiKeychainKeysQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return Knode API keychain keys with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, knodeApiKeychain, query, totalCount }) => {
      await seedKnodeApiKeychain(knodeApiKeychain);

      const response = await getKnodeApiKeychainKeys({
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
    "should return the Knode API keychain keys paginated with correct shape ($type, $roles)",
    async (token) => {
      await seedKnodeApiKeychain(knodeApiKeychain);

      const response = await getKnodeApiKeychainKeys({
        token: {
          ...token,
          organizationId: knodeApiKeychain.ownerId,
        },
      });

      expect(response.statusCode).toBe(200);
    },
  );

  it("should return 403 if the organization is not the owner of the Knode API keychain", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await getKnodeApiKeychainKeys({
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
      const response = await getKnodeApiKeychainKeys({
        token,
      });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent Knode API keychain id", async () => {
    const response = await getKnodeApiKeychainKeys({
      knodeApiKeychainId: NON_EXISTENT_KNODE_API_KEYCHAIN_ID,
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid Knode API keychain id format", async () => {
    const response = await getKnodeApiKeychainKeys({
      knodeApiKeychainId: "not-a-uuid" as never,
    });

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid pagination params", async () => {
    const response = await getKnodeApiKeychainKeys({
      query: { limit: "0", offset: "-1" },
    });

    expect(response.statusCode).toBe(400);
  });
});
