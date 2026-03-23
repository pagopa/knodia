/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zocker } from "zocker";

import { API_Organization } from "../src/models/organization/api.js";
import { injectAppRequest } from "./utils.ts";

const getOrganizationsMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getOrganizations: getOrganizationsMock,
    },
  };
});

const toK2KResult = (
  apiResult: API_Organization,
): k2kGatewayApi.Organization => ({
  attributes: apiResult.attributes,
  id: apiResult.id,
  name: apiResult.name,
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /organizations (getOrganizations)", () => {
  const defaultQuery = {
    knodeId: "Orion",
    limit: "10",
    offset: "0",
  };
  const parsedDefaultQuery = {
    limit: 10,
    offset: 0,
  };

  const expectedApiResult = zocker(API_Organization).generate();
  const k2kResult = toK2KResult(expectedApiResult);

  const mockK2KResponse: k2kGatewayApi.Organizations = {
    pagination: {
      ...parsedDefaultQuery,
      total: 1,
    },
    results: [k2kResult],
  };

  beforeEach(() => {
    getOrganizationsMock.mockReset();
  });

  it("should return 200 with converted results on success", async () => {
    getOrganizationsMock.mockResolvedValue({
      data: mockK2KResponse,
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/organizations")
      .query(defaultQuery);

    expect(response.statusCode).toBe(200);

    expect(getOrganizationsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: parsedDefaultQuery,
      }),
    );

    expect(response.json()).toEqual({
      pagination: { ...parsedDefaultQuery, total: 1 },
      results: [expectedApiResult],
    });
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
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
      state: "InvalidState",
    },
    { ...defaultQuery, organizationId: ["InvalidOrganizationId"] },
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
