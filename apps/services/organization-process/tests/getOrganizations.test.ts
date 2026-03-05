/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Organization } from "@knodia/organization-models";
import type { TestToken } from "@knodia/test-commons/auth";

import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import { forbiddenTestTokens } from "@knodia/test-commons/auth";
import { getMockOrganization } from "@knodia/test-commons/utils";
import { beforeAll, describe, expect, it } from "vitest";

import { organizationWriterService } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
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

const toExpectAPI_Organization = (org: Organization) => ({
  createdAt: org.createdAt.toISOString(),
  id: org.id,
  name: org.name,
});

describe("GET /organizations (getOrganizations)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  beforeAll(async () => {
    await Promise.all(
      mockOrganizations.map((org) =>
        organizationWriterService.upsertOrganization(org, 0),
      ),
    );
  });

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
    {
      ...defaultQuery,
      sortBy: "InvalidSortBy",
    },
    {
      ...defaultQuery,
      sortOrder: "InvalidSortOrder",
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

  it("should return organizations sorted by name asc (default)", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/organizations")
      .query(defaultQuery);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: mockOrganizations.slice(0, 4).map(toExpectAPI_Organization),
      pagination: {
        limit: 4,
        offset: 0,
        total: 5,
      },
    });
  });

  it("should return second page", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/organizations")
      .query({ limit: "4", offset: "4" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [toExpectAPI_Organization(mockOrganizations[4]!)],
      pagination: {
        limit: 4,
        offset: 4,
        total: 5,
      },
    });
  });

  it("should filter by name with q parameter", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/organizations")
      .query({ ...defaultQuery, q: "cha" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [toExpectAPI_Organization(mockOrganizations[2]!)],
      pagination: {
        limit: 4,
        offset: 0,
        total: 1,
      },
    });
  });

  it("should sort by name desc", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/organizations")
      .query({ ...defaultQuery, sortOrder: "desc" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: mockOrganizations
        .slice()
        .reverse()
        .slice(0, 4)
        .map(toExpectAPI_Organization),
      pagination: {
        limit: 4,
        offset: 0,
        total: 5,
      },
    });
  });

  it("should return empty list when no results match", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/organizations")
      .query({ ...defaultQuery, q: "nonexistent" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [],
      pagination: {
        limit: 4,
        offset: 0,
        total: 0,
      },
    });
  });
});
