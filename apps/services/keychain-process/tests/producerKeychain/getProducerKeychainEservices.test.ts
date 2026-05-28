/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type z from "zod";

import { generateId, type ProducerKeychainId } from "@knodia/common-models/ids";
import { type ProducerKeychainEservice } from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_GetProducerKeychainEservicesQueryParams } from "../../src/models/api.ts";

import { toAPI_ProducerKeychainEservice } from "../../src/models/apiConverter.ts";
import { producerKeychainWriterService } from "../setup.ts";
import { injectAppRequest, seedProducerKeychain } from "../utils.ts";
import {
  mockProducerKeychainEservices,
  producerKeychain1,
  producerKeychain2,
} from "./mocks/mockProducerKeychainEservices.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const seedProducerKeychains = async () => {
  await Promise.all([
    seedProducerKeychain(producerKeychain1),
    seedProducerKeychain(producerKeychain2),
  ]);
  await Promise.all(
    mockProducerKeychainEservices.map((ckp) =>
      producerKeychainWriterService.upsertProducerKeychainEservice(ckp, 1),
    ),
  );
};

const defaultQuery = {
  limit: "4",
  offset: "0",
};

async function getProducerKeychainEservices({
  producerKeychainId = producerKeychain1.id,
  query = defaultQuery,
  token = allowedTestTokens[0]!,
}: {
  producerKeychainId?: ProducerKeychainId;
  query?: typeof defaultQuery;
  token?: TestToken;
} = {}) {
  return await injectAppRequest(token)
    .get(`/producerKeychains/${producerKeychainId}/eservices`)
    .query(query);
}

describe("GET /producerKeychains/:producerKeychainId/eservices (getProducerKeychainEservices)", () => {
  const sortedMockProducerKeychainEservices = mockProducerKeychainEservices
    .filter((ckp) => ckp.producerKeychainId === producerKeychain1.id)
    .sort((a, b) => {
      const linkedAtDiff = b.linkedAt.getTime() - a.linkedAt.getTime();
      return linkedAtDiff !== 0
        ? linkedAtDiff
        : a.producerKeychainId.localeCompare(b.producerKeychainId);
    });

  it.each([
    {
      expectedResult: sortedMockProducerKeychainEservices.slice(0, 4),
      query: { ...defaultQuery },
      testCase: "pagination only (1st page), sort by linkedAt desc by default",
      totalCount: 5,
    },
    {
      expectedResult: sortedMockProducerKeychainEservices.slice(4, 5),
      query: {
        limit: "4",
        offset: "4",
      },
      testCase: "pagination only (2nd page), sort by linkedAt desc by default",
      totalCount: 5,
    },
  ] satisfies {
    expectedResult: ProducerKeychainEservice[];
    query: z.input<typeof API_GetProducerKeychainEservicesQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return producer keychain eservices with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, query, totalCount }) => {
      await seedProducerKeychains();

      const response = await getProducerKeychainEservices({ query });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        pagination: {
          limit: Number(query.limit),
          offset: Number(query.offset),
          total: totalCount,
        },
        results: expectedResult.map(toAPI_ProducerKeychainEservice),
      });
    },
  );

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      await seedProducerKeychains();

      const response = await getProducerKeychainEservices({ token });
      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getProducerKeychainEservices({ token });
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
    {
      ...defaultQuery,
      invalidParam: "invalid",
    },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await getProducerKeychainEservices({
        query: query as never,
      });
      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 404 for non-existent producer keychain id", async () => {
    const response = await getProducerKeychainEservices({
      producerKeychainId: generateId<ProducerKeychainId>(),
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await getProducerKeychainEservices({
      producerKeychainId: "not-a-uuid" as never,
    });

    expect(response.statusCode).toBe(400);
  });
});
