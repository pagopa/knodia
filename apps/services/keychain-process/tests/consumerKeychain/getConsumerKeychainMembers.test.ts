/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  type ConsumerKeychainId,
  generateId,
  type OrganizationId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cognitoIdmClientMock,
  cognitoIdmClientModuleMock,
} from "../cognitoIdmClientMock.ts";

vi.mock("@knodia/cognito-idm-client", () => cognitoIdmClientModuleMock);

import type { ConsumerKeychain } from "@knodia/keychain-models";

import { API_KeychainMembers } from "../../src/models/api.ts";
import { mockConsumerKeychains } from "../mockConsumerKeychains.ts";
import { injectAppRequest, seedConsumerKeychain } from "../utils.ts";

const memberIds = [
  "10000000-1000-1000-8000-000000000011",
  "10000000-1000-1000-8000-000000000012",
] as const;

const consumerKeychain: ConsumerKeychain = {
  ...mockConsumerKeychains[0]!,
  users: memberIds.map((userId, index) => ({
    addedAt: new Date(2026, 0, memberIds.length - index),
    userId: unsafeBrandUserId(userId),
  })),
};

const VALID_CONSUMER_KEYCHAIN_ID = consumerKeychain.id;
const NON_EXISTENT_CONSUMER_KEYCHAIN_ID = generateId<ConsumerKeychainId>();

const allowedTestTokens: Extract<TestToken, { type: "ui-session" }>[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getConsumerKeychainMembers = (
  consumerKeychainId: string,
  query: Record<string, string> = { limit: "50", offset: "0" },
  token: TestToken = {
    ...allowedTestTokens[0]!,
    organizationId: consumerKeychain.ownerId,
  },
) =>
  injectAppRequest(token)
    .get(`/consumerKeychains/${consumerKeychainId}/members`)
    .query(query);

describe("GET /consumerKeychains/:consumerKeychainId/members (getConsumerKeychainMembers)", () => {
  beforeEach(() => {
    cognitoIdmClientMock.getUserById.mockReset();
  });

  it.each(allowedTestTokens)(
    "should return the consumer keychain members with correct shape ($type, $roles)",
    async (token) => {
      await seedConsumerKeychain(consumerKeychain);

      cognitoIdmClientMock.getUserById.mockImplementation(
        async (userId: string) => {
          if (userId === memberIds[0]) {
            return {
              email: "mario.rossi@example.com",
              id: memberIds[0],
              roles: ["technical"],
              username: "Mario Rossi",
            };
          }

          if (userId === memberIds[1]) {
            return {
              email: "giulia.bianchi@example.com",
              id: memberIds[1],
              roles: ["administrative"],
              username: "Giulia Bianchi",
            };
          }

          return undefined;
        },
      );

      const response = await getConsumerKeychainMembers(
        VALID_CONSUMER_KEYCHAIN_ID,
        { limit: "50", offset: "0" },
        {
          ...token,
          organizationId: consumerKeychain.ownerId,
        },
      );

      expect(response.statusCode).toBe(200);
      expect(API_KeychainMembers.parse(response.json())).toEqual({
        pagination: {
          limit: 50,
          offset: 0,
          total: memberIds.length,
        },
        results: [
          {
            email: "mario.rossi@example.com",
            id: memberIds[0],
            username: "Mario Rossi",
          },
          {
            email: "giulia.bianchi@example.com",
            id: memberIds[1],
            username: "Giulia Bianchi",
          },
        ],
      });
    },
  );

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await getConsumerKeychainMembers(
      VALID_CONSUMER_KEYCHAIN_ID,
      undefined,
      {
        ...allowedTestTokens[0]!,
        organizationId: generateId<OrganizationId>(),
      },
    );

    expect(response.statusCode).toBe(403);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getConsumerKeychainMembers(
        VALID_CONSUMER_KEYCHAIN_ID,
        undefined,
        token,
      );

      expect(response.statusCode).toBe(403);
      expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
    },
  );

  it("should return 404 for non-existent consumer keychain id", async () => {
    const response = await getConsumerKeychainMembers(
      NON_EXISTENT_CONSUMER_KEYCHAIN_ID,
      undefined,
    );

    expect(response.statusCode).toBe(404);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await getConsumerKeychainMembers("not-a-uuid", undefined);

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
      const response = await getConsumerKeychainMembers(
        VALID_CONSUMER_KEYCHAIN_ID,
        query as never,
      );
      expect(response.statusCode).toBe(400);
    },
  );
});
