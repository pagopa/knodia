/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Organization } from "@knodia/organization-models";
import type { TestToken } from "@knodia/test-commons/auth";

import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import { forbiddenTestTokens } from "@knodia/test-commons/auth";
import { getMockOrganization } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Organization } from "../src/models/api.ts";

import {
  injectAppRequest,
  seedOrganization,
  toExpectAPI_Organization,
} from "./utils.ts";

const mockOrganization: Organization = {
  ...getMockOrganization(0),
  id: generateId<OrganizationId>(),
  name: "Test Organization",
};

const VALID_ORGANIZATION_ID = mockOrganization.id;
const NON_EXISTENT_ORGANIZATION_ID = generateId<OrganizationId>();

const allowedTestTokens: TestToken[] = [
  { type: "internal" },
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getOrganization = (
  organizationId: string,
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/organizations/${organizationId}`);

describe("GET /organizations/:organizationId (getOrganization)", () => {
  it.each(allowedTestTokens)(
    "should return the organization with correct shape ($type, $roles)",
    async (token) => {
      await seedOrganization(mockOrganization);

      const response = await getOrganization(VALID_ORGANIZATION_ID, token);

      expect(response.statusCode).toBe(200);

      const body = response.json<API_Organization>();
      expect(body).toEqual(toExpectAPI_Organization(mockOrganization));
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getOrganization(VALID_ORGANIZATION_ID, token);
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent organization id", async () => {
    const response = await getOrganization(NON_EXISTENT_ORGANIZATION_ID);
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid organization id format", async () => {
    const response = await getOrganization("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
