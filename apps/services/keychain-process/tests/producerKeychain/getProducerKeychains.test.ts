/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type z from "zod";

import { type EserviceId, generateId } from "@knodia/common-models/ids";
import {
  type ProducerKeychain,
  type ProducerKeychainEservice,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_GetProducerKeychainsQueryParams } from "../../src/models/api.ts";

import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import { producerKeychainWriterService } from "../setup.ts";
import { injectAppRequest, seedProducerKeychain } from "../utils.ts";
import { mockProducerKeychains } from "./mocks/mockProducerKeychains.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const matchingNamePrefix = "zz-combobox-match";
const ownerIdFilter = mockProducerKeychains[0]!.ownerId;
const alternateOwnerId = mockProducerKeychains[1]!.ownerId;
const seededProducerKeychains = mockProducerKeychains.map(
  (producerKeychain, index) => {
    if ([0, 4].includes(index)) {
      return {
        ...producerKeychain,
        name: { en: `${matchingNamePrefix}-${index}` },
        ownerId: ownerIdFilter,
      };
    }

    if (index === 7) {
      return {
        ...producerKeychain,
        ownerId: ownerIdFilter,
      };
    }

    if (index === 2) {
      return {
        ...producerKeychain,
        ownerId: alternateOwnerId,
      };
    }

    return producerKeychain;
  },
);

const seedProducerKeychains = async () => {
  await Promise.all(seededProducerKeychains.map(seedProducerKeychain));
};

const eserviceId1 = generateId<EserviceId>();
const eserviceId2 = generateId<EserviceId>();
const producerKeychainEservices: ProducerKeychainEservice[] = [
  {
    eserviceId: eserviceId1,
    linkedAt: new Date(),
    producerKeychainId: seededProducerKeychains[0]!.id,
  },
  {
    eserviceId: eserviceId1,
    linkedAt: new Date(),
    producerKeychainId: seededProducerKeychains[4]!.id,
  },
  {
    eserviceId: eserviceId2,
    linkedAt: new Date(),
    producerKeychainId: seededProducerKeychains[4]!.id,
  },
  {
    eserviceId: eserviceId2,
    linkedAt: new Date(),
    producerKeychainId: seededProducerKeychains[2]!.id,
  },
];
const producerKeychainIdsWithLinkedEservice1 = new Set([
  producerKeychainEservices[0]!.producerKeychainId,
  producerKeychainEservices[1]!.producerKeychainId,
]);
const seedProducerKeychainEservices = async () => {
  await Promise.all(
    producerKeychainEservices.map((link) =>
      producerKeychainWriterService.upsertProducerKeychainEservice(link, 0),
    ),
  );
};

describe("GET /producerKeychains (getProducerKeychains)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  async function getMockProducerKeychains({
    query = defaultQuery,
    token = allowedTestTokens[0]!,
  }: {
    query?: typeof defaultQuery & {
      eserviceId?: string;
      name?: string;
      ownerId?: string;
    };
    token?: TestToken;
  } = {}) {
    return injectAppRequest(token).get("/producerKeychains").query(query);
  }

  const sortedMockProducerKeychains = [...seededProducerKeychains].sort(
    (a, b) => {
      const updatedAtDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
      return updatedAtDiff !== 0 ? updatedAtDiff : a.id.localeCompare(b.id);
    },
  );

  it.each([
    {
      expectedResult: sortedMockProducerKeychains.slice(0, 4),
      query: defaultQuery,
      testCase: "pagination only (1st page), sort by updatedAt desc by default",
      totalCount: seededProducerKeychains.length,
    },
    {
      expectedResult: sortedMockProducerKeychains.slice(4, 8),
      query: {
        limit: "4",
        offset: "4",
      },
      testCase: "pagination only (2nd page), sort by updatedAt desc by default",
      totalCount: seededProducerKeychains.length,
    },
    {
      expectedResult: sortedMockProducerKeychains.filter((ck) =>
        producerKeychainIdsWithLinkedEservice1.has(ck.id),
      ),
      query: {
        ...defaultQuery,
        eserviceId: eserviceId1,
      },
      testCase:
        "filter by linked eserviceId, sort by updatedAt desc by default",
      totalCount: 2,
    },
    {
      expectedResult: sortedMockProducerKeychains.filter(
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
      expectedResult: sortedMockProducerKeychains.filter((ck) =>
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
      expectedResult: sortedMockProducerKeychains.filter(
        (ck) =>
          ck.ownerId === ownerIdFilter &&
          producerKeychainIdsWithLinkedEservice1.has(ck.id),
      ),
      query: {
        ...defaultQuery,
        eserviceId: eserviceId1,
        ownerId: ownerIdFilter,
      },
      testCase: "filter by ownerId and linked eserviceId together",
      totalCount: 2,
    },
  ] satisfies {
    expectedResult: ProducerKeychain[];
    query: z.input<typeof API_GetProducerKeychainsQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return producer keychains with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, query, totalCount }) => {
      await seedProducerKeychains();
      await seedProducerKeychainEservices();

      const response = await getMockProducerKeychains({ query });

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
      const response = await getMockProducerKeychains({ token });
      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getMockProducerKeychains({ token });
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
      const response = await getMockProducerKeychains({
        query: query as never,
      });
      expect(response.statusCode).toBe(400);
    },
  );
});
