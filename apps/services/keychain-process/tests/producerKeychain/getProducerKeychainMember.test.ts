/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  generateId,
  type OrganizationId,
  type ProducerKeychainId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cognitoIdmClientMock,
  cognitoIdmClientModuleMock,
} from "../cognitoIdmClientMock.ts";

vi.mock("@knodia/cognito-idm-client", () => cognitoIdmClientModuleMock);

import type { ProducerKeychain } from "@knodia/keychain-models";

import { getMockProducerKeychain } from "@knodia/test-commons/utils";

import { API_KeychainMembers, API_User } from "../../src/models/api.ts";
import { injectAppRequest, seedProducerKeychain } from "../utils.ts";

const memberIds = [
  "10000000-1000-1000-8000-000000000011",
  "10000000-1000-1000-8000-000000000012",
] as const;

const producerKeychain: ProducerKeychain = {
  ...getMockProducerKeychain(),
  users: memberIds.map((userId) => ({
    addedAt: new Date(),
    userId: unsafeBrandUserId(userId),
  })),
};

const VALID_PRODUCER_KEYCHAIN_ID = producerKeychain.id;
const VALID_MEMBER_ID = memberIds[0];
const NON_EXISTENT_PRODUCER_KEYCHAIN_ID = generateId<ProducerKeychainId>();
const NON_MEMBER_ID = "10000000-1000-1000-8000-000000000013";

const allowedTestTokens: Extract<TestToken, { type: "ui-session" }>[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getProducerKeychainMember = (
  producerKeychainId: string,
  userId: string,
  token: TestToken = {
    ...allowedTestTokens[0]!,
    organizationId: producerKeychain.ownerId,
  },
) =>
  injectAppRequest(token).get(
    `/producerKeychains/${producerKeychainId}/members/${userId}`,
  );

describe("GET /producerKeychains/:producerKeychainId/members/:userId (getProducerKeychainMember)", () => {
  beforeEach(() => {
    cognitoIdmClientMock.getUserById.mockReset();
  });

  it.each(allowedTestTokens)(
    "should return the producer keychain member with correct shape ($type, $roles)",
    async (token) => {
      await seedProducerKeychain(producerKeychain);

      cognitoIdmClientMock.getUserById.mockResolvedValue({
        email: "mario.rossi@example.com",
        id: VALID_MEMBER_ID,
        roles: ["technical"],
        username: "Mario Rossi",
      });

      const response = await getProducerKeychainMember(
        VALID_PRODUCER_KEYCHAIN_ID,
        VALID_MEMBER_ID,
        {
          ...token,
          organizationId: producerKeychain.ownerId,
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
    await seedProducerKeychain(producerKeychain);

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
      organizationId: producerKeychain.ownerId,
      roles: ["administrative"],
      type: "ui-session",
    };

    const listResponse = await injectAppRequest(uiToken)
      .get(`/producerKeychains/${VALID_PRODUCER_KEYCHAIN_ID}/members`)
      .query({ limit: "50", offset: "0" });

    const listBody = API_KeychainMembers.parse(listResponse.json());
    const expectedItem = listBody.results.find(
      (member) => member.id === VALID_MEMBER_ID,
    );

    const response = await getProducerKeychainMember(
      VALID_PRODUCER_KEYCHAIN_ID,
      VALID_MEMBER_ID,
      uiToken,
    );

    expect(response.statusCode).toBe(200);
    expect(API_User.parse(response.json())).toEqual(expectedItem!);
  });

  it("should return 403 if the organization is not the owner of the producer keychain", async () => {
    await seedProducerKeychain(producerKeychain);

    const response = await getProducerKeychainMember(
      VALID_PRODUCER_KEYCHAIN_ID,
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
      const response = await getProducerKeychainMember(
        VALID_PRODUCER_KEYCHAIN_ID,
        VALID_MEMBER_ID,
        token,
      );

      expect(response.statusCode).toBe(403);
      expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
    },
  );

  it("should return 404 for non-existent producer keychain id", async () => {
    const response = await getProducerKeychainMember(
      NON_EXISTENT_PRODUCER_KEYCHAIN_ID,
      VALID_MEMBER_ID,
    );

    expect(response.statusCode).toBe(404);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it("should return 404 if the user is not a member", async () => {
    await seedProducerKeychain(producerKeychain);

    const response = await getProducerKeychainMember(
      VALID_PRODUCER_KEYCHAIN_ID,
      NON_MEMBER_ID,
    );

    expect(response.statusCode).toBe(404);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await getProducerKeychainMember(
      "not-a-uuid",
      VALID_MEMBER_ID,
    );

    expect(response.statusCode).toBe(400);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid user id format", async () => {
    const response = await getProducerKeychainMember(
      VALID_PRODUCER_KEYCHAIN_ID,
      "not-a-uuid",
    );

    expect(response.statusCode).toBe(400);
    expect(cognitoIdmClientMock.getUserById).not.toHaveBeenCalled();
  });
});
