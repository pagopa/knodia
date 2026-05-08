/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { KnodeApiKeychain } from "@knodia/keychain-models";
import type z from "zod";

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_GetKnodeApiKeychainsQueryParams } from "../../src/models/api.ts";

import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import { mockKnodeApiKeychains } from "../mockKnodeApiKeychains.ts";
import { injectAppRequest, seedKnodeApiKeychain } from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const matchingNamePrefix = "zz-combobox-match";
const ownerIdFilter = mockKnodeApiKeychains[0]!.ownerId;
const alternateOwnerId = mockKnodeApiKeychains[1]!.ownerId;
const seededKnodeApiKeychains = mockKnodeApiKeychains.map(
  (knodeApiKeychain, index) => {
    if ([0, 4].includes(index)) {
      return {
        ...knodeApiKeychain,
        name: { en: `${matchingNamePrefix}-${index}` },
        ownerId: ownerIdFilter,
      };
    }

    if (index === 7) {
      return {
        ...knodeApiKeychain,
        ownerId: ownerIdFilter,
      };
    }

    if (index === 2) {
      return {
        ...knodeApiKeychain,
        ownerId: alternateOwnerId,
      };
    }

    return knodeApiKeychain;
  },
);

const seedKnodeApiKeychains = async () => {
  await Promise.all(seededKnodeApiKeychains.map(seedKnodeApiKeychain));
};

describe("GET /knodeApiKeychains (getKnodeApiKeychains)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };
  const sortedMockKnodeApiKeychains = [...seededKnodeApiKeychains].sort(
    (a, b) => {
      const updatedAtDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
      return updatedAtDiff !== 0 ? updatedAtDiff : a.id.localeCompare(b.id);
    },
  );

  async function getKnodeApiKeychains({
    query = defaultQuery,
    token = allowedTestTokens[0]!,
  }: {
    query?: typeof defaultQuery;
    token?: TestToken;
  } = {}) {
    return await injectAppRequest(token).get("/knodeApiKeychains").query(query);
  }

  it.each([
    {
      expectedResult: sortedMockKnodeApiKeychains.slice(0, 4),
      query: defaultQuery,
      testCase: "pagination only (1st page), sort by updatedAt desc by default",
      totalCount: seededKnodeApiKeychains.length,
    },
    {
      expectedResult: sortedMockKnodeApiKeychains.slice(4, 8),
      query: {
        limit: "4",
        offset: "4",
      },
      testCase: "pagination only (2nd page), sort by updatedAt desc by default",
      totalCount: seededKnodeApiKeychains.length,
    },
  ] satisfies {
    expectedResult: KnodeApiKeychain[];
    query: z.input<typeof API_GetKnodeApiKeychainsQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return Knode API keychains with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, query, totalCount }) => {
      await seedKnodeApiKeychains();

      const response = await getKnodeApiKeychains({
        query,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        pagination: {
          limit: Number(query.limit),
          offset: Number(query.offset),
          total: totalCount,
        },
        results: expectedResult.map(toAPI_Keychain),
      });
    },
  );

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      const response = await getKnodeApiKeychains({ token });
      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getKnodeApiKeychains({ token });

      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { limit: "abc", offset: "0" },
    { limit: "0", offset: "0" },
    { limit: "51", offset: "0" },
    { limit: "10", offset: "-1" },
    { limit: new Date(), offset: NaN },
    { limit: 9999999, offset: 9999999 },
    { ...defaultQuery, ownerId: "not-a-uuid" },
    {
      ...defaultQuery,
      invalidParam: "invalid",
    },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await getKnodeApiKeychains({ query: query as never });
      expect(response.statusCode).toBe(400);
    },
  );
});
