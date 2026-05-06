/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_OrganizationUsers } from "../src/models/api.ts";
import { injectAppRequest, makeCognitoUser } from "./utils.ts";

const sendMock = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-cognito-identity-provider", () => {
  class CognitoIdentityProviderClient {
    send = sendMock;
  }

  class ListUsersInGroupCommand {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
    }
  }

  return {
    CognitoIdentityProviderClient,
    ListUsersInGroupCommand,
  };
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /users (getOrganizationUsers)", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("should return all organization users with their technical flag", async () => {
    sendMock.mockImplementation(
      async (command: { input: { GroupName: string; NextToken?: string } }) => {
        if (
          command.input.GroupName === `org:${TEST_ORGANIZATION_ID}` &&
          command.input.NextToken === undefined
        ) {
          return {
            NextToken: "org-page-2",
            Users: [
              makeCognitoUser({
                email: "mario.rossi@example.com",
                id: "10000000-1000-1000-8000-000000000011",
                roles: ["administrative", "technical"],
                username: "Mario Rossi",
              }),
              makeCognitoUser({
                email: "giulia.bianchi@example.com",
                id: "10000000-1000-1000-8000-000000000012",
                roles: ["administrative"],
                username: "Giulia Bianchi",
              }),
            ],
          };
        }

        if (
          command.input.GroupName === `org:${TEST_ORGANIZATION_ID}` &&
          command.input.NextToken === "org-page-2"
        ) {
          return {
            Users: [
              makeCognitoUser({
                email: "luca.neri@example.com",
                id: "10000000-1000-1000-8000-000000000013",
                roles: ["technical"],
                username: "Luca Neri",
              }),
            ],
          };
        }

        throw new Error(
          `Unexpected Cognito request ${JSON.stringify(command.input)}`,
        );
      },
    );

    const response = await injectAppRequest(allowedTestTokens[0]!).get(
      "/users",
    );

    expect(response.statusCode).toBe(200);
    expect(API_OrganizationUsers.parse(response.json())).toEqual([
      {
        email: "mario.rossi@example.com",
        id: "10000000-1000-1000-8000-000000000011",
        isTechnical: true,
        username: "Mario Rossi",
      },
      {
        email: "giulia.bianchi@example.com",
        id: "10000000-1000-1000-8000-000000000012",
        isTechnical: false,
        username: "Giulia Bianchi",
      },
      {
        email: "luca.neri@example.com",
        id: "10000000-1000-1000-8000-000000000013",
        isTechnical: true,
        username: "Luca Neri",
      },
    ]);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      sendMock.mockResolvedValue({ Users: [] });

      const response = await injectAppRequest(token).get("/users");

      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token).get("/users");

      expect(response.statusCode).toBe(403);
      expect(sendMock).not.toHaveBeenCalled();
    },
  );
});
