/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  type ConsumerKeychainId,
  generateId,
  type OrganizationId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-cognito-identity-provider", () => {
  class CognitoIdentityProviderClient {
    send = sendMock;
  }

  class ListUsersCommand {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
    }
  }

  return {
    CognitoIdentityProviderClient,
    ListUsersCommand,
  };
});

import type { ConsumerKeychain } from "@knodia/keychain-models";

import { API_Users } from "../src/models/api.ts";
import { mockConsumerKeychains } from "./mockConsumerKeychains.ts";
import {
  injectAppRequest,
  makeCognitoUser,
  seedConsumerKeychain,
} from "./utils.ts";

const memberIds = [
  "10000000-1000-1000-8000-000000000011",
  "10000000-1000-1000-8000-000000000012",
] as const;

const consumerKeychain: ConsumerKeychain = {
  ...mockConsumerKeychains[0]!,
  users: memberIds.map(unsafeBrandUserId),
};

const VALID_CONSUMER_KEYCHAIN_ID = consumerKeychain.id;
const NON_EXISTENT_CONSUMER_KEYCHAIN_ID = generateId<ConsumerKeychainId>();

const allowedTestTokens: Extract<TestToken, { type: "ui-session" }>[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getConsumerKeychainMembers = (
  consumerKeychainId: string,
  token: TestToken = {
    ...allowedTestTokens[0]!,
    organizationId: consumerKeychain.ownerId,
  },
) =>
  injectAppRequest(token).get(
    `/consumerKeychains/${consumerKeychainId}/members`,
  );

describe("GET /consumerKeychains/:consumerKeychainId/members (getConsumerKeychainMembers)", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it.each(allowedTestTokens)(
    "should return the consumer keychain members with correct shape ($type, $roles)",
    async (token) => {
      await seedConsumerKeychain(consumerKeychain);

      sendMock.mockImplementation(async (command: { input: unknown }) => {
        const input = command.input as { Filter?: string };

        if (input.Filter === `sub = "${memberIds[0]}"`) {
          return {
            Users: [
              makeCognitoUser({
                email: "mario.rossi@example.com",
                id: memberIds[0],
                username: "Mario Rossi",
              }),
            ],
          };
        }

        if (input.Filter === `sub = "${memberIds[1]}"`) {
          return {
            Users: [
              makeCognitoUser({
                email: "giulia.bianchi@example.com",
                id: memberIds[1],
                username: "Giulia Bianchi",
              }),
            ],
          };
        }

        throw new Error(
          `Unexpected Cognito request ${JSON.stringify(command.input)}`,
        );
      });

      const response = await getConsumerKeychainMembers(
        VALID_CONSUMER_KEYCHAIN_ID,
        {
          ...token,
          organizationId: consumerKeychain.ownerId,
        },
      );

      expect(response.statusCode).toBe(200);
      expect(API_Users.parse(response.json())).toEqual([
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
      ]);
    },
  );

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await getConsumerKeychainMembers(
      VALID_CONSUMER_KEYCHAIN_ID,
      {
        ...allowedTestTokens[0]!,
        organizationId: generateId<OrganizationId>(),
      },
    );

    expect(response.statusCode).toBe(403);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getConsumerKeychainMembers(
        VALID_CONSUMER_KEYCHAIN_ID,
        token,
      );

      expect(response.statusCode).toBe(403);
      expect(sendMock).not.toHaveBeenCalled();
    },
  );

  it("should return 404 for non-existent consumer keychain id", async () => {
    const response = await getConsumerKeychainMembers(
      NON_EXISTENT_CONSUMER_KEYCHAIN_ID,
    );

    expect(response.statusCode).toBe(404);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await getConsumerKeychainMembers("not-a-uuid");

    expect(response.statusCode).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
