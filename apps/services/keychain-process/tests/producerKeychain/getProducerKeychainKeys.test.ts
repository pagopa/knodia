/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { KeychainKey, ProducerKeychain } from "@knodia/keychain-models";
import type z from "zod";

import {
  generateId,
  type OrganizationId,
  type ProducerKeychainId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockKeychainKey,
  getMockProducerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  type API_GetProducerKeychainKeysQueryParams,
  API_KeychainKeys,
} from "../../src/models/api.ts";
import { toAPI_KeychainKey } from "../../src/models/apiConverter.ts";
import { injectAppRequest, seedProducerKeychain } from "../utils.ts";

const existingKeys = Array.from({ length: 10 }, (_, i) => ({
  ...getMockKeychainKey(i),
  createdAt: new Date(i + 1),
})).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

const producerKeychain: ProducerKeychain = {
  ...getMockProducerKeychain(),
  keys: existingKeys,
};

const VALID_PRODUCER_KEYCHAIN_ID = producerKeychain.id;
const NON_EXISTENT_PRODUCER_KEYCHAIN_ID = generateId<ProducerKeychainId>();

const allowedTestTokens: Extract<TestToken, { type: "ui-session" }>[] = [
  { roles: ["technical"], type: "ui-session" },
  { roles: ["administrative"], type: "ui-session" },
];

const defaultQuery = { limit: "4", offset: "0" };

const getProducerKeychainKeys = ({
  producerKeychainId = VALID_PRODUCER_KEYCHAIN_ID,
  query: { limit, offset } = defaultQuery,
  token = {
    ...allowedTestTokens[0]!,
    organizationId: producerKeychain.ownerId,
  },
}: {
  producerKeychainId?: ProducerKeychainId;
  query?: { limit: string; offset: string };
  token?: TestToken;
} = {}) =>
  injectAppRequest(token).get(
    `/producerKeychains/${producerKeychainId}/keys?limit=${limit}&offset=${offset}`,
  );

describe("GET /producerKeychains/:producerKeychainId/keys (getProducerKeychainKeys)", () => {
  it.each([
    {
      expectedResult: existingKeys.slice(0, 4),
      producerKeychain,
      query: defaultQuery,
      testCase: "pagination only (1st page), sort by createdAt desc by default",
      totalCount: existingKeys.length,
    },
    {
      expectedResult: existingKeys.slice(4, 8),
      producerKeychain,
      query: { ...defaultQuery, offset: "4" },
      testCase: "pagination only (2nd page), sort by createdAt desc by default",
      totalCount: existingKeys.length,
    },
    {
      expectedResult: [],
      producerKeychain,
      query: { ...defaultQuery, offset: "10" },
      testCase:
        "offset exceeds existing keys, sort by createdAt desc by default",
      totalCount: existingKeys.length,
    },
    {
      expectedResult: [],
      producerKeychain: {
        ...producerKeychain,
        keys: [],
      },
      query: defaultQuery,
      testCase: "Producer Keychain with zero keys",
      totalCount: 0,
    },
  ] satisfies {
    expectedResult: KeychainKey[];
    producerKeychain: ProducerKeychain;
    query: z.input<typeof API_GetProducerKeychainKeysQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return Producer Keychain keys with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, producerKeychain, query, totalCount }) => {
      await seedProducerKeychain(producerKeychain);

      const response = await getProducerKeychainKeys({
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
    "should return the producer keychain keys paginated with correct shape ($type, $roles)",
    async (token) => {
      await seedProducerKeychain(producerKeychain);

      const response = await getProducerKeychainKeys({
        token: {
          ...token,
          organizationId: producerKeychain.ownerId,
        },
      });

      expect(response.statusCode).toBe(200);
    },
  );

  it("should return 403 if the organization is not the owner of the producer keychain", async () => {
    await seedProducerKeychain(producerKeychain);

    const response = await getProducerKeychainKeys({
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
      const response = await getProducerKeychainKeys({
        token,
      });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent producer keychain id", async () => {
    const response = await getProducerKeychainKeys({
      producerKeychainId: NON_EXISTENT_PRODUCER_KEYCHAIN_ID,
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await getProducerKeychainKeys({
      producerKeychainId: "not-a-uuid" as never,
    });

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid pagination params", async () => {
    const response = await getProducerKeychainKeys({
      query: { limit: "0", offset: "-1" },
    });

    expect(response.statusCode).toBe(400);
  });
});
