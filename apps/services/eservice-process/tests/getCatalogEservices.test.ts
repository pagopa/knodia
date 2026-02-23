/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type z from "zod";

import { type Eservice } from "@knodia/eservice-models";
import { toExpectAPI_Eservice } from "@knodia/test-commons/utils";
import { beforeAll, describe, expect, it } from "vitest";

import type {
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../src/models/api.ts";

import { mockEservices } from "./mockEservices.ts";
import { eserviceWriterService } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

describe("POST /catalog (getCatalogEservices)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  const eserviceWithCategory = mockEservices.at(3);
  const eserviceCategory = eserviceWithCategory?.categories.at(0);

  if (!eserviceCategory) {
    throw new Error("Missing category for mock e-service at index 3");
  }

  const orderedByUpdatedAtEservicesResult = [
    mockEservices.at(1)!,
    mockEservices.at(2)!,
    mockEservices.at(3)!,
    mockEservices.at(4)!,
    mockEservices.at(5)!,
    mockEservices.at(6)!,
    mockEservices.at(7)!,
    mockEservices.at(8)!,
    mockEservices.at(9)!,
  ].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());

  beforeAll(async () => {
    await Promise.all(
      mockEservices.map((eservice) =>
        eserviceWriterService.upsertEservice(eservice, 0),
      ),
    );
  });

  it.each([
    {
      body: { keywords: "other name" },
      expectedResult: orderedByUpdatedAtEservicesResult.slice(0, 4),
      query: defaultQuery,
      testCase: "pagination only (1st page), sorted by updatedAt asc",
      totalCount: orderedByUpdatedAtEservicesResult.length,
    },
    {
      body: { keywords: "other name" },
      expectedResult: orderedByUpdatedAtEservicesResult.slice(4, 8),
      query: { limit: "4", offset: "4" },
      testCase: "pagination only (2nd page), sorted by updatedAt asc",
      totalCount: orderedByUpdatedAtEservicesResult.length,
    },
    {
      body: { keywords: "1 knodia 1" },
      expectedResult: [mockEservices.at(0)] as Eservice[],
      query: defaultQuery,
      testCase: "search by keywords in name",
      totalCount: 1,
    },
    {
      body: { keywords: "2 knodia 2" },
      expectedResult: [mockEservices.at(1)] as Eservice[],
      query: defaultQuery,
      testCase: "search by keywords in description",
      totalCount: 1,
    },
    {
      body: { category: eserviceCategory },
      expectedResult: [eserviceWithCategory] as Eservice[],
      query: defaultQuery,
      testCase: "search by category",
      totalCount: 1,
    },

    {
      body: { keywords: "no match" },
      expectedResult: [] as Eservice[],
      query: defaultQuery,
      testCase: "no results",
      totalCount: 0,
    },
  ] satisfies {
    body: API_GetCatalogEserviceSearchParams;
    expectedResult: Eservice[];
    query: z.input<typeof API_GetCatalogEservicesQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return catalog e-services with correct shape and pagination: $testCase (seed #%#)",
    async ({ body, expectedResult, query, totalCount }) => {
      const response = await injectAppRequest()
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
      const response = await injectAppRequest()
        .post("/catalog")
        .query(query as never)
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );
});
