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
} from "./cognitoIdmClientMock.ts";

vi.mock("@knodia/cognito-idm-client", () => cognitoIdmClientModuleMock);

import type { ConsumerKeychain } from "@knodia/keychain-models";

import { API_KeychainMembers, API_User } from "../../src/models/api.ts";
import { mockConsumerKeychains } from "../mockConsumerKeychains.ts";
import { injectAppRequest, seedConsumerKeychain } from "../utils.ts";

const memberIds = [
  "10000000-1000-1000-8000-000000000011",
  "10000000-1000-1000-8000-000000000012",
] as const;

const consumerKeychain: ConsumerKeychain = {
  ...mockConsumerKeychains[0]!,
  users: memberIds.map((userId) => ({
    addedAt: new Date(),
    userId: unsafeBrandUserId(userId),
  })),
};

const VALID_CONSUMER_KEYCHAIN_ID = consumerKeychain.id;
const VALID_MEMBER_ID = memberIds[0];
const NON_EXISTENT_CONSUMER_KEYCHAIN_ID = generateId<ConsumerKeychainId>();
const NON_MEMBER_ID = "10000000-1000-1000-8000-000000000013";

const allowedTestTokens: Extract<TestToken, { type: "ui-session" }>[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getConsumerKeychainMember = (
  consumerKeychainId: string,
  userId: string,
  token: TestToken = {
    ...allowedTestTokens[0]!,
    organizationId: consumerKeychain.ownerId,
  },
) =>
  injectAppRequest(token).get(
    `/consumerKeychains/${consumerKeychainId}/members/${userId}`,
  );

describe("GET /consumerKeychains/:consumerKeychainId/members/:userId (getConsumerKeychainMember)", () => {
  beforeEach(() => {
    cognitoIdmClientMock.getUserById.mockReset();
  });

  it.each(allowedTestTokens)(
    "should return the consumer keychain member with correct shape ($type, $roles)",
    async (token) => {
      await seedConsumerKeychain(consumerKeychain);

      cognitoIdmClientMock.getUserById.mockResolvedValue({
        email: "mario.rossi@example.com",
        id: VALID_MEMBER_ID,
        roles: ["technical"],
        username: "Mario Rossi",
      });

      const response = await getConsumerKeychainMember(
        VALID_CONSUMER_KEYCHAIN_ID,
        VALID_MEMBER_ID,
        {
          ...token,
          organizationId: consumerKeychain.ownerId,
        },
      );

      expect(response.statusCode).toBe(200);
      expect(API_User.parse(response.json())).toEqual({
        email: "mario.rossi@example.com",
        id: VALID_MEMBER_ID,
        username: "Mario Rossi",
      });
    },
  );

  it("should return the same member as the list endpoint", async () => {
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

    const uiToken: TestToken = {
      organizationId: consumerKeychain.ownerId,
      roles: ["administrative"],
      type: "ui-session",
    };

    const listResponse = await injectAppRequest(uiToken)
      .get(`/consumerKeychains/${VALID_CONSUMER_KEYCHAIN_ID}/members`)
      .query({ limit: "50", offset: "0" });

    const listBody = API_KeychainMembers.parse(listResponse.json());
    const expectedItem = listBody.results.find(
      (member) => member.id === VALID_MEMBER_ID,
    );

    const response = await getConsumerKeychainMember(
      VALID_CONSUMER_KEYCHAIN_ID,
      VALID_MEMBER_ID,
      uiToken,
    );

    expect(response.statusCode).toBe(200);
    expect(API_User.parse(response.json())).toEqual(expectedItem!);
  });

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await getConsumerKeychainMember(
      VALID_CONSUMER_KEYCHAIN_ID,
      VALID_MEMBER_ID,
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
      const response = await getConsumerKeychainMember(
        VALID_CONSUMER_KEYCHAIN_ID,
        VALID_MEMBER_ID,
        token,
      );

      expect(response.statusCode).toBe(403);
      expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
    },
  );

  it("should return 404 for non-existent consumer keychain id", async () => {
    const response = await getConsumerKeychainMember(
      NON_EXISTENT_CONSUMER_KEYCHAIN_ID,
      VALID_MEMBER_ID,
    );

    expect(response.statusCode).toBe(404);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it("should return 404 if the user is not a member", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await getConsumerKeychainMember(
      VALID_CONSUMER_KEYCHAIN_ID,
      NON_MEMBER_ID,
    );

    expect(response.statusCode).toBe(404);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await getConsumerKeychainMember(
      "not-a-uuid",
      VALID_MEMBER_ID,
    );

    expect(response.statusCode).toBe(400);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid user id format", async () => {
    const response = await getConsumerKeychainMember(
      VALID_CONSUMER_KEYCHAIN_ID,
      "not-a-uuid",
    );

    expect(response.statusCode).toBe(400);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });
});
