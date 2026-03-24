/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Organization } from "@knodia/organization-models";
import type { TestToken } from "@knodia/test-commons/auth";
import type z from "zod";

import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import { forbiddenTestTokens } from "@knodia/test-commons/auth";
import { getMockOrganization } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_GetOrganizationsQueryParams } from "../src/models/api.ts";

import {
  injectAppRequest,
  seedOrganization,
  toExpectAPI_Organization,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
  { type: "internal" },
];

const mockOrganizations: Organization[] = [
  {
    ...getMockOrganization(0),
    id: generateId<OrganizationId>(),
    name: "Alpha",
  },
  { ...getMockOrganization(1), id: generateId<OrganizationId>(), name: "Beta" },
  {
    ...getMockOrganization(2),
    id: generateId<OrganizationId>(),
    name: "Charlie",
  },
  {
    ...getMockOrganization(3),
    id: generateId<OrganizationId>(),
    name: "Delta",
  },
  { ...getMockOrganization(4), id: generateId<OrganizationId>(), name: "Echo" },
];

describe("GET /organizations (getOrganizations)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  it.each([
    {
      expectedResult: [
        mockOrganizations[0],
        mockOrganizations[1],
        mockOrganizations[2],
        mockOrganizations[3],
      ] as Organization[],
      query: { ...defaultQuery },
      testCase: "pagination only (1st page)",
      totalCount: 5,
    },
    {
      expectedResult: [mockOrganizations[4]] as Organization[],
      query: { limit: "4", offset: "4" },
      testCase: "pagination only (2nd page)",
      totalCount: 5,
    },
    {
      expectedResult: [
        mockOrganizations[0],
        mockOrganizations[1],
      ] as Organization[],
      query: {
        ...defaultQuery,
        organizationId: [mockOrganizations[0]!.id, mockOrganizations[1]!.id],
      },
      testCase: "filter by organization IDs",
      totalCount: 2,
    },
  ] satisfies {
    expectedResult: Organization[];
    query: z.input<typeof API_GetOrganizationsQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return organizations with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, query, totalCount }) => {
      await Promise.all(mockOrganizations.map(seedOrganization));

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/organizations")
        .query(query);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        pagination: {
          limit: Number(query.limit),
          offset: Number(query.offset),
          total: totalCount,
        },
        results: expectedResult.map(toExpectAPI_Organization),
      });
    },
  );

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token)
        .get("/organizations")
        .query(defaultQuery);
      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token)
        .get("/organizations")
        .query(defaultQuery);
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { limit: "abc", offset: "0" },
    { limit: "0", offset: "0" },
    { limit: "51", offset: "0" },
    { limit: "10", offset: "-1" },
    { limit: new Date(), offset: NaN },
    { limit: 9999999, offset: 9999999 },
    {
      ...defaultQuery,
      organizationId: ["invalid-uuid"],
    },
    {
      ...defaultQuery,
      invalidParam: "invalid",
    },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/organizations")
        .query(query as never);
      expect(response.statusCode).toBe(400);
    },
  );
});
