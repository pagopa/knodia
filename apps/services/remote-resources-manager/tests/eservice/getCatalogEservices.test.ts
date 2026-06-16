/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zocker } from "zocker";

import {
  API_CatalogEserviceSearchResult,
  type API_CatalogEserviceSearchResult as API_CatalogEserviceSearchResultType,
} from "../../src/models/eservice/api.ts";
import { toK2KMode, toK2KVersionState } from "../k2kConverters.ts";
import { injectAppRequest } from "../utils.ts";

const getCatalogEservicesMock = vi.hoisted(() => vi.fn());
const getOrganizationsMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getCatalogEservices: getCatalogEservicesMock,
      getOrganizations: getOrganizationsMock,
    },
  };
});

const toK2KResult = (
  apiResult: API_CatalogEserviceSearchResultType,
): k2kGatewayApi.CatalogEserviceSearchResult => {
  const { producer, ...rest } = apiResult;
  return {
    ...rest,
    latestVersionState: toK2KVersionState(apiResult.latestVersionState),
    mode: toK2KMode(apiResult.mode),
    producerId: producer.id,
  };
};

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /catalog (getCatalogEservices)", () => {
  const defaultQuery = {
    limit: "10",
    offset: "0",
  };
  const parsedDefaultQuery = {
    limit: 10,
    offset: 0,
  };

  const expectedApiResult = zocker(API_CatalogEserviceSearchResult).generate();
  const k2kResult = toK2KResult(expectedApiResult);

  const mockK2kResponse: k2kGatewayApi.CatalogEserviceSearchResults = {
    pagination: { limit: 10, offset: 0, total: 1 },
    results: [k2kResult],
  };

  beforeEach(() => {
    getCatalogEservicesMock.mockReset();
    getOrganizationsMock.mockReset();
  });

  it("should return 200 with converted results on success", async () => {
    getCatalogEservicesMock.mockResolvedValue({
      data: mockK2kResponse,
    });
    getOrganizationsMock.mockResolvedValue({
      data: {
        pagination: { limit: 1, offset: 0, total: 1 },
        results: [
          {
            attributes: [],
            id: expectedApiResult.producer.id,
            name: expectedApiResult.producer.name,
          },
        ],
      },
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/catalog")
      .query(defaultQuery)
      .body({ keywords: "test", knodeId: "Orion" });

    expect(response.statusCode).toBe(200);

    expect(getCatalogEservicesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { keywords: "test" },
        query: parsedDefaultQuery,
      }),
    );

    expect(getOrganizationsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: {
          limit: 1,
          offset: 0,
          organizationId: [expectedApiResult.producer.id],
        },
      }),
    );

    expect(response.json()).toEqual({
      pagination: { limit: 10, offset: 0, total: 1 },
      results: [{ ...expectedApiResult, knodeId: "Orion" }],
    });
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post("/catalog")
        .query(defaultQuery)
        .body({ keywords: "test", knodeId: "Orion" });
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    {
      body: { keywords: "test", knodeId: "Orion" },
      query: { limit: "abc", offset: "0" },
    },
    {
      body: { keywords: "test", knodeId: "Orion" },
      query: { limit: "0", offset: "0" },
    },
    {
      body: { keywords: "test", knodeId: "Orion" },
      query: { limit: "51", offset: "0" },
    },
    {
      body: { keywords: "test", knodeId: "Orion" },
      query: { limit: "10", offset: "-1" },
    },
    { body: {}, query: defaultQuery },
    { body: { keywords: "", knodeId: "Orion" }, query: defaultQuery },
    { body: { keywords: "test" }, query: defaultQuery },
    {
      body: { keywords: "test", knodeId: "InvalidKnode" },
      query: defaultQuery,
    },
    {
      body: { category: { code: "code-only" }, knodeId: "Orion" },
      query: defaultQuery,
    },
    {
      body: { category: { code: 123, scheme: "scheme" }, knodeId: "Orion" },
      query: defaultQuery,
    },
    {
      body: {
        category: { code: "code", scheme: "scheme", x: "invalid" },
        knodeId: "Orion",
      },
      query: defaultQuery,
    },
    {
      body: { invalidParam: "invalid", keywords: "test", knodeId: "Orion" },
      query: defaultQuery,
    },
  ])(
    "should return 400 if query/body parameters are formatted incorrectly (%o)",
    async ({ body, query }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/catalog")
        .query(query as never)
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );
});
