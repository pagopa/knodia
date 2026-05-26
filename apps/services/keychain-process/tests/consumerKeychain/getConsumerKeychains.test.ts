/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { KnodeId, PurposeId } from "@knodia/common-models/ids";
import type z from "zod";

import { toExternalResource } from "@knodia/common-models/externalResource";
import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockPurpose } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_GetConsumerKeychainsQueryParams } from "../../src/models/api.ts";

import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import { consumerKeychainWriterService } from "../setup.ts";
import { injectAppRequest, seedConsumerKeychain } from "../utils.ts";
import { mockConsumerKeychains } from "./mocks/mockConsumerKeychains.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const matchingNamePrefix = "zz-combobox-match";
const ownerIdFilter = mockConsumerKeychains[0]!.ownerId;
const alternateOwnerId = mockConsumerKeychains[1]!.ownerId;
const seededConsumerKeychains = mockConsumerKeychains.map(
  (consumerKeychain, index) => {
    if ([0, 4].includes(index)) {
      return {
        ...consumerKeychain,
        name: { en: `${matchingNamePrefix}-${index}` },
        ownerId: ownerIdFilter,
      };
    }

    if (index === 7) {
      return {
        ...consumerKeychain,
        ownerId: ownerIdFilter,
      };
    }

    if (index === 2) {
      return {
        ...consumerKeychain,
        ownerId: alternateOwnerId,
      };
    }

    return consumerKeychain;
  },
);

const seedConsumerKeychains = async () => {
  await Promise.all(seededConsumerKeychains.map(seedConsumerKeychain));
};

const knodeId: KnodeId = "Orion";
const otherKnodeId: KnodeId = "Lynx";
const purpose1 = getMockPurpose(1);
const purpose2 = getMockPurpose(2);
const consumerKeychainPurposes: ConsumerKeychainPurpose[] = [
  {
    consumerKeychainId: seededConsumerKeychains[0]!.id,
    linkedAt: new Date(),
    purpose: toExternalResource<PurposeId>(purpose1.id, knodeId),
  },
  {
    consumerKeychainId: seededConsumerKeychains[4]!.id,
    linkedAt: new Date(),
    purpose: toExternalResource<PurposeId>(purpose1.id, knodeId),
  },
  {
    consumerKeychainId: seededConsumerKeychains[4]!.id,
    linkedAt: new Date(),
    purpose: toExternalResource<PurposeId>(purpose2.id, knodeId),
  },
  {
    consumerKeychainId: seededConsumerKeychains[2]!.id,
    linkedAt: new Date(),
    purpose: toExternalResource<PurposeId>(purpose2.id, otherKnodeId),
  },
];
const consumerKeychainIdsWithLinkedPurpose1 = new Set([
  consumerKeychainPurposes[0]!.consumerKeychainId,
  consumerKeychainPurposes[1]!.consumerKeychainId,
]);
const seedConsumerKeychainPurpose = async () => {
  await Promise.all([
    consumerKeychainWriterService.upsertConsumerKeychainPurpose(
      consumerKeychainPurposes[0]!,
      0,
    ),
    consumerKeychainWriterService.upsertConsumerKeychainPurpose(
      consumerKeychainPurposes[1]!,
      0,
    ),
    consumerKeychainWriterService.upsertConsumerKeychainPurpose(
      consumerKeychainPurposes[2]!,
      0,
    ),
    consumerKeychainWriterService.upsertConsumerKeychainPurpose(
      consumerKeychainPurposes[3]!,
      0,
    ),
  ]);
};

describe("GET /consumerKeychains (getConsumerKeychains)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };
  const sortedMockConsumerKeychains = [...seededConsumerKeychains].sort(
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
      totalCount: seededConsumerKeychains.length,
    },
    {
      expectedResult: sortedMockConsumerKeychains.slice(4, 8),
      query: {
        limit: "4",
        offset: "4",
      },
      testCase: "pagination only (2nd page), sort by updatedAt desc by default",
      totalCount: seededConsumerKeychains.length,
    },
    {
      expectedResult: sortedMockConsumerKeychains.filter((ck) =>
        consumerKeychainIdsWithLinkedPurpose1.has(ck.id),
      ),
      query: {
        ...defaultQuery,
        purpose: `${knodeId}:${purpose1.id}`,
      },
      testCase:
        "filter by purpose producer (purposeId, knodeId), sort by updatedAt desc by default",
      totalCount: 2,
    },
    {
      expectedResult: sortedMockConsumerKeychains.filter(
        (ck) => ck.ownerId === ownerIdFilter,
      ),
      query: {
        ...defaultQuery,
        ownerId: ownerIdFilter,
      },
      testCase: "filter by ownerId, sort by updatedAt desc by default",
      totalCount: 3,
    },
    {
      expectedResult: sortedMockConsumerKeychains.filter((ck) =>
        ck.name.en.toLowerCase().includes(matchingNamePrefix),
      ),
      query: {
        ...defaultQuery,
        name: matchingNamePrefix.toUpperCase(),
      },
      testCase: "filter by name, case insensitive",
      totalCount: 2,
    },
    {
      expectedResult: sortedMockConsumerKeychains.filter(
        (ck) =>
          ck.ownerId === ownerIdFilter &&
          consumerKeychainIdsWithLinkedPurpose1.has(ck.id),
      ),
      query: {
        ...defaultQuery,
        ownerId: ownerIdFilter,
        purpose: `${knodeId}:${purpose1.id}`,
      },
      testCase: "filter by ownerId and purpose together",
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
    { ...defaultQuery, ownerId: "not-a-uuid" },
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
