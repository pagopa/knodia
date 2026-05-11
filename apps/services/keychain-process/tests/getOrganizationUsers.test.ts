/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_OrganizationUsers } from "../src/models/api.ts";
import {
  cognitoIdmClientMock,
  cognitoIdmClientModuleMock,
} from "./cognitoIdmClientMock.ts";
import { injectAppRequest } from "./utils.ts";

vi.mock("@knodia/cognito-idm-client", () => cognitoIdmClientModuleMock);

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /users (getOrganizationUsers)", () => {
  beforeEach(() => {
    cognitoIdmClientMock.getOrganizationUsers.mockReset();
  });

  it("should return all organization users with their technical flag", async () => {
    cognitoIdmClientMock.getOrganizationUsers.mockResolvedValue([
      {
        email: "mario.rossi@example.com",
        id: "10000000-1000-1000-8000-000000000011",
        roles: ["administrative", "technical"],
        username: "Mario Rossi",
      },
      {
        email: "giulia.bianchi@example.com",
        id: "10000000-1000-1000-8000-000000000012",
        roles: ["administrative"],
        username: "Giulia Bianchi",
      },
      {
        email: "luca.neri@example.com",
        id: "10000000-1000-1000-8000-000000000013",
        roles: ["technical"],
        username: "Luca Neri",
      },
    ]);

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
    expect(cognitoIdmClientMock.getOrganizationUsers).toHaveBeenCalledTimes(1);
    expect(cognitoIdmClientMock.getOrganizationUsers).toHaveBeenCalledWith(
      TEST_ORGANIZATION_ID,
    );
  });

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      cognitoIdmClientMock.getOrganizationUsers.mockResolvedValue([]);

      const response = await injectAppRequest(token).get("/users");

      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token).get("/users");

      expect(response.statusCode).toBe(403);
      expect(cognitoIdmClientMock.getOrganizationUsers).not.toHaveBeenCalled();
    },
  );
});
