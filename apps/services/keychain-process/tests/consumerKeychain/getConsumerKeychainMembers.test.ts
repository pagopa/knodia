/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { IdmUser } from "@knodia/cognito-idm-client";
import type { ConsumerKeychain, KeychainUser } from "@knodia/keychain-models";
import type z from "zod";

import {
  type ConsumerKeychainId,
  generateId,
  type OrganizationId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockConsumerKeychain } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cognitoIdmClientMock,
  cognitoIdmClientModuleMock,
} from "../cognitoIdmClientMock.ts";

vi.mock("@knodia/cognito-idm-client", () => cognitoIdmClientModuleMock);

import {
  type API_GetConsumerKeychainMembersQueryParams,
  API_KeychainMembers,
} from "../../src/models/api.ts";
import { injectAppRequest, seedConsumerKeychain } from "../utils.ts";

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

const consumerKeychain: ConsumerKeychain = {
  ...getMockConsumerKeychain(),
  users: existingMembers,
};

const VALID_CONSUMER_KEYCHAIN_ID = consumerKeychain.id;
const NON_EXISTENT_CONSUMER_KEYCHAIN_ID = generateId<ConsumerKeychainId>();

const allowedTestTokens: Extract<TestToken, { type: "ui-session" }>[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const defaultQuery = { limit: "4", offset: "0" };

const getConsumerKeychainMembers = ({
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
  injectAppRequest(token)
    .get(`/consumerKeychains/${consumerKeychainId}/members`)
    .query({
      limit,
      offset,
    });

const toAPI_User = (user: IdmUser) => ({
  email: user.email,
  id: user.id,
  username: user.username,
});

describe("GET /consumerKeychains/:consumerKeychainId/members (getConsumerKeychainMembers)", () => {
  beforeEach(() => {
    cognitoIdmClientMock.getUserById.mockReset();
    cognitoIdmClientMock.getUserById.mockImplementation(
      async (userId: string) => existingUsers.find((u) => u.id === userId),
    );
  });

  it.each([
    {
      consumerKeychain,
      expectedResult: existingMembers.slice(0, 4),
      query: defaultQuery,
      testCase: "pagination only (1st page), sort by addedAt desc by default",
      totalCount: existingMembers.length,
    },
    {
      consumerKeychain,
      expectedResult: existingMembers.slice(4, 8),
      query: { ...defaultQuery, offset: "4" },
      testCase: "pagination only (2nd page), sort by addedAt desc by default",
      totalCount: existingMembers.length,
    },
    {
      consumerKeychain,
      expectedResult: [],
      query: { ...defaultQuery, offset: "10" },
      testCase:
        "offset exceeds existing members, sort by addedAt desc by default",
      totalCount: existingMembers.length,
    },
    {
      consumerKeychain: {
        ...consumerKeychain,
        users: [],
      },
      expectedResult: [],
      query: defaultQuery,
      testCase: "consumer keychain with zero members",
      totalCount: 0,
    },
  ] satisfies {
    consumerKeychain: ConsumerKeychain;
    expectedResult: KeychainUser[];
    query: z.input<typeof API_GetConsumerKeychainMembersQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return consumer keychain members with correct shape and pagination: $testCase (seed #%#)",
    async ({ consumerKeychain, expectedResult, query, totalCount }) => {
      await seedConsumerKeychain(consumerKeychain);

      const response = await getConsumerKeychainMembers({
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
    "should return the consumer keychain members paginated with correct shape ($type, $roles)",
    async (token) => {
      await seedConsumerKeychain(consumerKeychain);

      const response = await getConsumerKeychainMembers({
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

    const response = await getConsumerKeychainMembers({
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
      const response = await getConsumerKeychainMembers({
        token,
      });

      expect(response.statusCode).toBe(403);
      expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
    },
  );

  it("should return 404 for non-existent consumer keychain id", async () => {
    const response = await getConsumerKeychainMembers({
      consumerKeychainId: NON_EXISTENT_CONSUMER_KEYCHAIN_ID,
    });

    expect(response.statusCode).toBe(404);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await getConsumerKeychainMembers({
      consumerKeychainId: "not-a-uuid" as never,
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
      const response = await getConsumerKeychainMembers({
        query: query as never,
      });
      expect(response.statusCode).toBe(400);
    },
  );

  it("should return members with only `id` for users that no longer exist in IDM", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const deletedUserIds = new Set([
      existingUsers[1]!.id,
      existingUsers[2]!.id,
    ]);
    cognitoIdmClientMock.getUserById.mockImplementation(
      async (userId: string) =>
        deletedUserIds.has(unsafeBrandUserId(userId))
          ? undefined
          : existingUsers.find((u) => u.id === userId),
    );

    const response = await getConsumerKeychainMembers({
      query: { limit: "10", offset: "0" },
    });

    expect(response.statusCode).toBe(200);
    const body = API_KeychainMembers.parse(response.json());
    expect(body.pagination.total).toBe(existingMembers.length);
    expect(body.results).toEqual(
      existingMembers.map(({ userId }) =>
        deletedUserIds.has(userId)
          ? { id: userId }
          : toAPI_User(existingUsers.find((u) => u.id === userId)!),
      ),
    );
  });
});
