/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

<<<<<<<< HEAD:apps/services/organization-process/tests/getOperators.test.ts
import { API_Operators } from "../src/models/api.ts";
import { injectAppRequest } from "./utils.ts";
========
import { API_OrganizationUsers } from "../../src/models/api.ts";
import {
  cognitoIdmClientMock,
  cognitoIdmClientModuleMock,
} from "../cognitoIdmClientMock.ts";
import { injectAppRequest } from "../utils.ts";
>>>>>>>> main:apps/services/keychain-process/tests/user/getOrganizationUsers.test.ts

const getOrganizationUsersMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/cognito-idm-client", () => ({
  buildCognitoIdmClient: () => ({
    getOrganizationUsers: getOrganizationUsersMock,
  }),
}));

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /operators (getOperators)", () => {
  beforeEach(() => {
    getOrganizationUsersMock.mockReset();
  });

  it("should return all organization operators with their roles", async () => {
    getOrganizationUsersMock.mockResolvedValue([
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
      "/operators",
    );

    expect(response.statusCode).toBe(200);
    expect(API_Operators.parse(response.json())).toEqual([
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
    expect(getOrganizationUsersMock).toHaveBeenCalledWith(TEST_ORGANIZATION_ID);
    expect(getOrganizationUsersMock).toHaveBeenCalledTimes(1);
  });

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      getOrganizationUsersMock.mockResolvedValue([]);

      const response = await injectAppRequest(token).get("/operators");

      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token).get("/operators");

      expect(response.statusCode).toBe(403);
      expect(getOrganizationUsersMock).not.toHaveBeenCalled();
    },
  );
});
