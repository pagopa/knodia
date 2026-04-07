/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type z from "zod";

import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockPurpose } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_GetConsumerKeychainsQueryParams } from "../src/models/api.ts";

import { toAPI_Keychain } from "../src/models/apiConverter.ts";
import { mockConsumerKeychains } from "./mockConsumerKeychains.ts";
import { keychainWriterService } from "./setup.ts";
import { injectAppRequest, seedConsumerKeychain } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const seedConsumerKeychains = async () => {
  await Promise.all(mockConsumerKeychains.map(seedConsumerKeychain));
};

const purpose = getMockPurpose();
const consumerKeychainPurposes: ConsumerKeychainPurpose[] = [
  {
    consumerKeychainId: mockConsumerKeychains[0]!.id,
    linkedAt: new Date(),
    purposeId: purpose.id,
  },
  {
    consumerKeychainId: mockConsumerKeychains[4]!.id,
    linkedAt: new Date(),
    purposeId: purpose.id,
  },
];
const consumerKeychainPurposeIds = new Set(
  consumerKeychainPurposes.map((p) => p.consumerKeychainId),
);
const seedConsumerKeychainPurpose = async () => {
  await Promise.all([
    keychainWriterService.upsertConsumerKeychainPurpose(
      consumerKeychainPurposes[0]!,
      0,
    ),
    keychainWriterService.upsertConsumerKeychainPurpose(
      consumerKeychainPurposes[1]!,
      0,
    ),
  ]);
};

describe("GET /consumerKeychains (getConsumerKeychains)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };
  const sortedMockConsumerKeychains = [...mockConsumerKeychains].sort(
    (a, b) => {
      const updatedAtDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
      return updatedAtDiff !== 0 ? updatedAtDiff : a.id.localeCompare(b.id);
    },
  );

  it.each([
    {
      expectedResult: sortedMockConsumerKeychains.slice(0, 4),
      query: defaultQuery,
      testCase: "pagination only (1st page), sort by updatedAt desc by default",
      totalCount: mockConsumerKeychains.length,
    },
    {
      expectedResult: sortedMockConsumerKeychains.slice(4, 8),
      query: {
        limit: "4",
        offset: "4",
      },
      testCase: "pagination only (2nd page), sort by updatedAt desc by default",
      totalCount: mockConsumerKeychains.length,
    },
    {
      expectedResult: sortedMockConsumerKeychains.filter((ck) =>
        consumerKeychainPurposeIds.has(ck.id),
      ),
      query: {
        ...defaultQuery,
        purposeId: purpose.id,
      },
      testCase: "filter by purposeId, sort by updatedAt desc by default",
      totalCount: 2,
    },
  ] satisfies {
    expectedResult: ConsumerKeychain[];
    query: z.input<typeof API_GetConsumerKeychainsQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return consumer keychains with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, query, totalCount }) => {
      await seedConsumerKeychains();
      await seedConsumerKeychainPurpose();

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/consumerKeychains")

        .query(query);

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
      const response = await injectAppRequest(token)
        .get("/consumerKeychains")
        .query(defaultQuery);
      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token)
        .get("/consumerKeychains")
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
        .get("/consumerKeychains")
        .query(query as never);
      expect(response.statusCode).toBe(400);
    },
  );
});
