/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type z from "zod";

import { generateId } from "@knodia/common-models/ids";
import { type ConsumerKeychainPurpose } from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_GetConsumerKeychainPurposesQueryParams } from "../../src/models/api.ts";

import { toAPI_ConsumerKeychainPurpose } from "../../src/models/apiConverter.ts";
import {
  consumerKeychain1,
  consumerKeychain2,
  mockConsumerKeychainPurposes,
} from "../mockConsumerKeychainPurposes.ts";
import { consumerKeychainWriterService } from "../setup.ts";
import { injectAppRequest, seedConsumerKeychain } from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const seedConsumerKeychains = async () => {
  await Promise.all([
    seedConsumerKeychain(consumerKeychain1),
    seedConsumerKeychain(consumerKeychain2),
  ]);
  await Promise.all(
    mockConsumerKeychainPurposes.map((ckp) =>
      consumerKeychainWriterService.upsertConsumerKeychainPurpose(ckp, 1),
    ),
  );
};

describe("GET /consumerKeychains/:consumerKeychainId/purposes (getConsumerKeychainPurposes)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };
  const sortedMockConsumerKeychainPurposes = mockConsumerKeychainPurposes
    .filter((ckp) => ckp.consumerKeychainId === consumerKeychain1.id)
    .sort((a, b) => {
      const linkedAtDiff = b.linkedAt.getTime() - a.linkedAt.getTime();
      return linkedAtDiff !== 0
        ? linkedAtDiff
        : a.consumerKeychainId.localeCompare(b.consumerKeychainId);
    });

  it.each([
    {
      expectedResult: sortedMockConsumerKeychainPurposes.slice(0, 4),
      query: { ...defaultQuery },
      testCase: "pagination only (1st page), sort by linkedAt desc by default",
      totalCount: 5,
    },
    {
      expectedResult: sortedMockConsumerKeychainPurposes.slice(4, 5),
      query: {
        limit: "4",
        offset: "4",
      },
      testCase: "pagination only (2nd page), sort by linkedAt desc by default",
      totalCount: 5,
    },
  ] satisfies {
    expectedResult: ConsumerKeychainPurpose[];
    query: z.input<typeof API_GetConsumerKeychainPurposesQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return consumer keychain purposes with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, query, totalCount }) => {
      await seedConsumerKeychains();

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get(`/consumerKeychains/${consumerKeychain1.id}/purposes`)
        .query(query);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        pagination: {
          limit: Number(query.limit),
          offset: Number(query.offset),
          total: totalCount,
        },
        results: expectedResult.map(toAPI_ConsumerKeychainPurpose),
      });
    },
  );

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      await seedConsumerKeychains();

      const response = await injectAppRequest(token)
        .get(`/consumerKeychains/${consumerKeychain1.id}/purposes`)
        .query(defaultQuery);
      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token)
        .get(`/consumerKeychains/${consumerKeychain1.id}/purposes`)
        .query(defaultQuery);
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
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get(`/consumerKeychains/${consumerKeychain1.id}/purposes`)
        .query(query as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 404 for non-existent consumer keychain id", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/consumerKeychains/${generateId()}/purposes`)
      .query(defaultQuery);

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/consumerKeychains/not-a-uuid/purposes`)
      .query(defaultQuery);

    expect(response.statusCode).toBe(400);
  });
});
