/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { IdmUser } from "@knodia/cognito-idm-client";
import type { KeychainUser, ProducerKeychain } from "@knodia/keychain-models";
import type z from "zod";

import {
  generateId,
  type OrganizationId,
  type ProducerKeychainId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockProducerKeychain } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cognitoIdmClientMock,
  cognitoIdmClientModuleMock,
} from "../cognitoIdmClientMock.ts";

vi.mock("@knodia/cognito-idm-client", () => cognitoIdmClientModuleMock);

import {
  type API_GetProducerKeychainMembersQueryParams,
  API_KeychainMembers,
} from "../../src/models/api.ts";
import { injectAppRequest, seedProducerKeychain } from "../utils.ts";

const buildMockUser = (index: number): IdmUser => ({
  email: `user${index}@example.com`,
  id: unsafeBrandUserId(
    `10000000-1000-1000-8000-${String(index).padStart(12, "0")}`,
  ),
  roles: ["technical"],
  username: `User ${index}`,
});

const existingUsers = Array.from({ length: 10 }, (_, i) => buildMockUser(i));
const existingMembers: KeychainUser[] = existingUsers
  .map((user, i) => ({
    addedAt: new Date(i + 1),
    userId: user.id,
  }))
  .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

const producerKeychain: ProducerKeychain = {
  ...getMockProducerKeychain(),
  users: existingMembers,
};

const VALID_PRODUCER_KEYCHAIN_ID = producerKeychain.id;
const NON_EXISTENT_PRODUCER_KEYCHAIN_ID = generateId<ProducerKeychainId>();

const allowedTestTokens: Extract<TestToken, { type: "ui-session" }>[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const defaultQuery = { limit: "4", offset: "0" };

const getProducerKeychainMembers = ({
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
  injectAppRequest(token)
    .get(`/producerKeychains/${producerKeychainId}/members`)
    .query({
      limit,
      offset,
    });

const toAPI_User = (user: IdmUser) => ({
  email: user.email,
  id: user.id,
  username: user.username,
});

describe("GET /producerKeychains/:producerKeychainId/members (getProducerKeychainMembers)", () => {
  beforeEach(() => {
    cognitoIdmClientMock.getUserById.mockReset();
    cognitoIdmClientMock.getUserById.mockImplementation(
      async (userId: string) => existingUsers.find((u) => u.id === userId),
    );
  });

  it.each([
    {
      expectedResult: existingMembers.slice(0, 4),
      producerKeychain,
      query: defaultQuery,
      testCase: "pagination only (1st page), sort by addedAt desc by default",
      totalCount: existingMembers.length,
    },
    {
      expectedResult: existingMembers.slice(4, 8),
      producerKeychain,
      query: { ...defaultQuery, offset: "4" },
      testCase: "pagination only (2nd page), sort by addedAt desc by default",
      totalCount: existingMembers.length,
    },
    {
      expectedResult: [],
      producerKeychain,
      query: { ...defaultQuery, offset: "10" },
      testCase:
        "offset exceeds existing members, sort by addedAt desc by default",
      totalCount: existingMembers.length,
    },
    {
      expectedResult: [],
      producerKeychain: {
        ...producerKeychain,
        users: [],
      },
      query: defaultQuery,
      testCase: "producer keychain with zero members",
      totalCount: 0,
    },
  ] satisfies {
    expectedResult: KeychainUser[];
    producerKeychain: ProducerKeychain;
    query: z.input<typeof API_GetProducerKeychainMembersQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return producer keychain members with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, producerKeychain, query, totalCount }) => {
      await seedProducerKeychain(producerKeychain);

      const response = await getProducerKeychainMembers({
        query,
      });

      expect(response.statusCode).toBe(200);
      expect(API_KeychainMembers.parse(response.json())).toEqual({
        pagination: {
          limit: Number(query.limit),
          offset: Number(query.offset),
          total: totalCount,
        },
        results: expectedResult.map(({ userId }) =>
          toAPI_User(existingUsers.find((u) => u.id === userId)!),
        ),
      });
    },
  );

  it.each(allowedTestTokens)(
    "should return the producer keychain members paginated with correct shape ($type, $roles)",
    async (token) => {
      await seedProducerKeychain(producerKeychain);

      const response = await getProducerKeychainMembers({
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

    const response = await getProducerKeychainMembers({
      token: {
        ...allowedTestTokens[0]!,
        organizationId: generateId<OrganizationId>(),
      },
    });

    expect(response.statusCode).toBe(403);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getProducerKeychainMembers({
        token,
      });

      expect(response.statusCode).toBe(403);
      expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
    },
  );

  it("should return 404 for non-existent producer keychain id", async () => {
    const response = await getProducerKeychainMembers({
      producerKeychainId: NON_EXISTENT_PRODUCER_KEYCHAIN_ID,
    });

    expect(response.statusCode).toBe(404);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await getProducerKeychainMembers({
      producerKeychainId: "not-a-uuid" as never,
    });

    expect(response.statusCode).toBe(400);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it.each([
    { limit: "abc", offset: "0" },
    { limit: "0", offset: "0" },
    { limit: "51", offset: "0" },
    { limit: "10", offset: "-1" },
    { limit: new Date(), offset: NaN },
    { limit: 9999999, offset: 9999999 },
    {
      invalidParam: "invalid",
    },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await getProducerKeychainMembers({
        query: query as never,
      });
      expect(response.statusCode).toBe(400);
    },
  );
});
