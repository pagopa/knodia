/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { API_Users } from "../src/models/api.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

function makeCognitoUser({
  email,
  id,
  username,
}: {
  email: string;
  id: string;
  username: string;
}) {
  return {
    Attributes: [
      { Name: "sub", Value: id },
      { Name: "email", Value: email },
    ],
    Username: username,
  };
}

describe("GET /users/technical (getTechnicalUsers)", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("should return the intersection between organization users and technical users", async () => {
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
                username: "mario.rossi@example.com",
              }),
              makeCognitoUser({
                email: "giulia.bianchi@example.com",
                id: "10000000-1000-1000-8000-000000000012",
                username: "giulia.bianchi@example.com",
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
                username: "luca.neri@example.com",
              }),
            ],
          };
        }

        if (
          command.input.GroupName === "role:technical" &&
          command.input.NextToken === undefined
        ) {
          return {
            NextToken: "technical-page-2",
            Users: [
              makeCognitoUser({
                email: "mario.rossi@example.com",
                id: "10000000-1000-1000-8000-000000000011",
                username: "mario.rossi@example.com",
              }),
            ],
          };
        }

        if (
          command.input.GroupName === "role:technical" &&
          command.input.NextToken === "technical-page-2"
        ) {
          return {
            Users: [
              makeCognitoUser({
                email: "luca.neri@example.com",
                id: "10000000-1000-1000-8000-000000000013",
                username: "luca.neri@example.com",
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
      "/users/technical",
    );

    expect(response.statusCode).toBe(200);
    expect(API_Users.parse(response.json())).toEqual([
      {
        email: "mario.rossi@example.com",
        id: "10000000-1000-1000-8000-000000000011",
        username: "mario.rossi@example.com",
      },
      {
        email: "luca.neri@example.com",
        id: "10000000-1000-1000-8000-000000000013",
        username: "luca.neri@example.com",
      },
    ]);
    expect(sendMock).toHaveBeenCalledTimes(4);
  });

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      sendMock.mockResolvedValue({ Users: [] });

      const response = await injectAppRequest(token).get("/users/technical");

      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token).get("/users/technical");

      expect(response.statusCode).toBe(403);
      expect(sendMock).not.toHaveBeenCalled();
    },
  );
});
