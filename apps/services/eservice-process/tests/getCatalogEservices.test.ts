/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type z from "zod";

import {
  type Eservice,
  EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { toExpectAPI_Eservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import type {
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../src/models/api.ts";

import { mockEservices } from "./mockEservices.ts";
import { injectAppRequest, seedEservice } from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

describe("POST /catalog (getCatalogEservices)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  const eserviceWithCategory = mockEservices.at(3);
  const eserviceCategory = eserviceWithCategory?.categories.at(0);

  if (!eserviceWithCategory || !eserviceCategory) {
    throw new Error("Missing category for mock e-service at index 3");
  }

  const withLatestVersionState = (
    eservice: Eservice,
    state: EserviceVersionState,
  ): Eservice => ({
    ...eservice,
    versions: [
      zocker(EserviceVersion)
        .supply(EserviceVersion.shape.state, state)
        .generate(),
    ],
  });

  const withActiveLatestVersion = (eservice: Eservice): Eservice =>
    withLatestVersionState(eservice, EserviceVersionState.enum.Active);

  const catalogSeedEservices = [
    withActiveLatestVersion(mockEservices.at(1)!),
    withActiveLatestVersion(mockEservices.at(2)!),
    withActiveLatestVersion(mockEservices.at(3)!),
    withActiveLatestVersion(mockEservices.at(4)!),
    withActiveLatestVersion(mockEservices.at(5)!),
    withActiveLatestVersion(mockEservices.at(6)!),
    withActiveLatestVersion(mockEservices.at(7)!),
    withActiveLatestVersion(mockEservices.at(8)!),
    withActiveLatestVersion(mockEservices.at(9)!),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const seedEservices = async (eservices: Eservice[]) =>
    await Promise.all(eservices.map(seedEservice));

  it.each([
    {
      body: { keywords: "other name" },
      expectedResult: catalogSeedEservices.slice(0, 4),
      query: defaultQuery,
      seedData: catalogSeedEservices,
      testCase: "pagination only (1st page), sorted by updatedAt desc",
      totalCount: catalogSeedEservices.length,
    },
    {
      body: { keywords: "other name" },
      expectedResult: catalogSeedEservices.slice(4, 8),
      query: { limit: "4", offset: "4" },
      seedData: catalogSeedEservices,
      testCase: "pagination only (2nd page), sorted by updatedAt asc",
      totalCount: catalogSeedEservices.length,
    },
    {
      body: { keywords: "1 knodia 1" },
      expectedResult: [
        withActiveLatestVersion(mockEservices.at(0)!),
      ] as Eservice[],
      query: defaultQuery,
      seedData: [withActiveLatestVersion(mockEservices.at(0)!)],
      testCase: "search by keywords in name",
      totalCount: 1,
    },
    {
      body: { keywords: "2 knodia 2" },
      expectedResult: [
        withActiveLatestVersion(mockEservices.at(1)!),
      ] as Eservice[],
      query: defaultQuery,
      seedData: [withActiveLatestVersion(mockEservices.at(1)!)],
      testCase: "search by keywords in description",
      totalCount: 1,
    },
    {
      body: { category: eserviceCategory },
      expectedResult: [
        withActiveLatestVersion(eserviceWithCategory),
      ] as Eservice[],
      query: defaultQuery,
      seedData: [withActiveLatestVersion(eserviceWithCategory)],
      testCase: "search by category",
      totalCount: 1,
    },

    {
      body: { keywords: "no match" },
      expectedResult: [] as Eservice[],
      query: defaultQuery,
      seedData: [withActiveLatestVersion(mockEservices.at(1)!)],
      testCase: "no results",
      totalCount: 0,
    },
  ] satisfies {
    body: API_GetCatalogEserviceSearchParams;
    expectedResult: Eservice[];
    query: z.input<typeof API_GetCatalogEservicesQueryParams>;
    seedData: Eservice[];
    testCase: string;
    totalCount: number;
  }[])(
    "should return catalog e-services with correct shape and pagination: $testCase (seed #%#)",
    async ({ body, expectedResult, query, seedData, totalCount }) => {
      await seedEservices(seedData);

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/catalog")
        .query(query)
        .body(body);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        items: expectedResult.map((e) => toExpectAPI_Eservice(e)),
        pagination: {
          limit: Number(query.limit),
          offset: Number(query.offset),
          total: totalCount,
        },
      });
    },
  );

  it("should not include e-services without Active or Suspended versions", async () => {
    const activeEservice = withLatestVersionState(
      mockEservices.at(1)!,
      EserviceVersionState.enum.Active,
    );
    const suspendedEservice = withLatestVersionState(
      mockEservices.at(2)!,
      EserviceVersionState.enum.Suspended,
    );
    const archivedOnlyEservice = withLatestVersionState(
      mockEservices.at(3)!,
      EserviceVersionState.enum.Archived,
    );

    await seedEservices([
      activeEservice,
      suspendedEservice,
      archivedOnlyEservice,
    ]);

    const expectedResult = [activeEservice, suspendedEservice].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/catalog")
      .query(defaultQuery)
      .body({ keywords: "other name" });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    const returnedIds = body.items.map(
      (item: { id: string }): string => item.id,
    );

    expect(body.pagination).toEqual({
      limit: Number(defaultQuery.limit),
      offset: Number(defaultQuery.offset),
      total: 2,
    });
    expect(returnedIds).toContain(activeEservice.id);
    expect(returnedIds).toContain(suspendedEservice.id);
    expect(returnedIds).not.toContain(archivedOnlyEservice.id);
    expect(body.items).toHaveLength(2);
    expect(body.items).toEqual(
      expect.arrayContaining(
        expectedResult.map((e) => toExpectAPI_Eservice(e)),
      ),
    );
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post("/catalog")
        .query(defaultQuery)
        .body({ keywords: "test" });
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { body: { keywords: "other name" }, query: { limit: "abc", offset: "0" } },
    { body: { keywords: "other name" }, query: { limit: "0", offset: "0" } },
    { body: { keywords: "other name" }, query: { limit: "51", offset: "0" } },
    { body: { keywords: "other name" }, query: { limit: "10", offset: "-1" } },
    {
      body: { keywords: "other name" },
      query: { limit: 9999999, offset: 9999999 },
    },
    {
      body: { keywords: "other name" },
      query: { ...defaultQuery, invalidParam: "invalid" },
    },
    { body: {}, query: defaultQuery },
    { body: { keywords: "" }, query: defaultQuery },
    {
      body: { category: { code: "code-only" } },
      query: defaultQuery,
    },
    {
      body: { category: { code: 123, scheme: "scheme" } },
      query: defaultQuery,
    },
    {
      body: { category: { code: "code", scheme: "scheme", x: "invalid" } },
      query: defaultQuery,
    },
    {
      body: { invalidParam: "invalid", keywords: "other name" },
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
