import type z from "zod";

import { SortDirection } from "@knodia/db-readmodel-commons";
import { Eservice, EserviceMode } from "@knodia/eservice-models";
import { API_EserviceVersionState } from "@knodia/eservice-models/api";
import {
  toExpectAPI_Eservice,
  upsertEservice,
} from "@knodia/test-commons/utils";
import { beforeAll, describe, expect, it } from "vitest";

import type { API_GetEservicesQueryParams } from "../src/models/api.ts";

import { mockEservices, producerId } from "./mockEservices.ts";
import { readmodelDb } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

describe("GET /eservices (getEservices)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  beforeAll(async () => {
    await Promise.all(
      mockEservices.map((eservice) => upsertEservice(eservice, 0, readmodelDb)),
    );
  });

  it.each([
    {
      expectedResult: [
        mockEservices[0],
        mockEservices[1],
        mockEservices[2],
        mockEservices[3],
      ] as Eservice[],
      query: { ...defaultQuery },
      testCase: "pagination only (1st page), sort by name asc by default",
    },
    {
      expectedResult: [
        mockEservices[1],
        mockEservices[2],
        mockEservices[3],
        mockEservices[4],
      ] as Eservice[],
      query: { ...defaultQuery, producerId },
      testCase: "pagination only (1st page), sort by name asc by default",
    },
    {
      expectedResult: [
        mockEservices[4],
        mockEservices[5],
        mockEservices[6],
        mockEservices[7],
      ] as Eservice[],
      query: {
        limit: "4",
        offset: "4",
      },
      testCase: "pagination only (2nd page), sort by name asc by default",
    },
    {
      expectedResult: [mockEservices[1], mockEservices[3]] as Eservice[],
      query: { ...defaultQuery, producerId, q: "KNODIA" },
      testCase: "search query",
    },
    {
      expectedResult: [
        mockEservices[1],
        mockEservices[4],
        mockEservices[7],
      ] as Eservice[],
      query: {
        ...defaultQuery,
        mode: EserviceMode.enum.ProvideData,
        producerId,
      },
      testCase: "filter by mode",
    },
    {
      expectedResult: [
        mockEservices[1],
        mockEservices[2],
        mockEservices[4],
        mockEservices[5],
      ] as Eservice[],
      query: {
        ...defaultQuery,
        producerId,
        state: [
          API_EserviceVersionState.enum.Active,
          API_EserviceVersionState.enum.Suspended,
        ],
      },
      testCase: "filter by state",
    },
    {
      expectedResult: [
        mockEservices[9],
        mockEservices[8],
        mockEservices[7],
        mockEservices[6],
      ] as Eservice[],
      query: {
        ...defaultQuery,
        producerId,
        sortBy: "name",
        sortOrder: SortDirection.enum.desc,
      },
      testCase: "sort by name desc",
    },
    {
      expectedResult: [mockEservices[1]] as Eservice[],
      query: {
        ...defaultQuery,
        mode: EserviceMode.enum.ProvideData,
        producerId,
        q: "KNODIA",
        sortBy: "name",
        sortOrder: SortDirection.enum.desc,
        state: [API_EserviceVersionState.enum.Suspended],
      },
      testCase: "full query",
    },
  ] satisfies {
    expectedResult: Eservice[];
    query: z.input<typeof API_GetEservicesQueryParams>;
    testCase: string;
  }[])(
    "should return e-services with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, query }) => {
      const response = await injectAppRequest()
        .get("/eservices")

        .query(query);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        items: expectedResult.map((e) => toExpectAPI_Eservice(e)),
        pagination: {
          limit: Number(query.limit),
          offset: Number(query.offset),
          total: mockEservices.length,
        },
      });
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
      state: ["InvalidState"],
    },
    { ...defaultQuery, mode: "InvalidMode" },
    {
      ...defaultQuery,
      sortBy: "InvalidSortBy",
    },
    {
      ...defaultQuery,
      sortOrder: "InvalidSortOrder",
    },
    { ...defaultQuery, q: [1, 2, 3] },
    {
      ...defaultQuery,
      invalidParam: "invalid",
    },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await injectAppRequest()
        .get("/eservices")
        .query(query as never);
      expect(response.statusCode).toBe(400);
    },
  );
});
