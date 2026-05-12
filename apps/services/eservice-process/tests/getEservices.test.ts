/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { EserviceId } from "@knodia/common-models/ids";
import type z from "zod";

import { SortDirection } from "@knodia/db-readmodel-commons/models";
import { type Eservice, EserviceMode } from "@knodia/eservice-models";
import { API_EserviceVersionState } from "@knodia/eservice-models/api";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { toExpectAPI_Eservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_GetEservicesQueryParams } from "../src/models/api.ts";

import { mockEservices, producerId } from "./mockEservices.ts";
import { injectAppRequest, seedEservice } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
  { type: "internal" },
];

describe("GET /eservices (getEservices)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  it.each([
    {
      expectedResult: [
        mockEservices[0],
        mockEservices[1],
        mockEservices[2],
        mockEservices[3],
      ] as Eservice[],
      query: defaultQuery,
      testCase: "pagination only (1st page), sort by name asc by default",
      totalCount: mockEservices.length,
    },
    {
      expectedResult: [
        mockEservices[1],
        mockEservices[2],
        mockEservices[3],
        mockEservices[4],
      ] as Eservice[],
      query: { ...defaultQuery, producerId },
      testCase:
        "pagination with producerId (1st page), sort by name asc by default",
      totalCount: 9,
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
      totalCount: mockEservices.length,
    },
    {
      expectedResult: [mockEservices[1], mockEservices[3]] as Eservice[],
      query: { ...defaultQuery, producerId, q: "KNODIA" },
      testCase: "search query",
      totalCount: 2,
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
      totalCount: 3,
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
      totalCount: 7,
    },
    {
      expectedResult: [
        mockEservices[0],
        mockEservices[1],
        mockEservices[2],
      ] as Eservice[],
      query: {
        ...defaultQuery,
        eserviceId: [
          mockEservices[0]!.id,
          mockEservices[1]!.id,
          mockEservices[2]!.id,
        ] as EserviceId[],
      },
      testCase: "filter by E-service ID",
      totalCount: 3,
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
      totalCount: 9,
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
      totalCount: 1,
    },
  ] satisfies {
    expectedResult: Eservice[];
    query: z.input<typeof API_GetEservicesQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return e-services with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, query, totalCount }) => {
      await Promise.all(mockEservices.map(seedEservice));

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/eservices")
        .query(query);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        pagination: {
          limit: Number(query.limit),
          offset: Number(query.offset),
          total: totalCount,
        },
        results: expectedResult.map((e) => toExpectAPI_Eservice(e)),
      });
    },
  );

  it.each(allowedTestTokens)(
    "should return 200 for authorized token ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token)
        .get("/eservices")
        .query(defaultQuery);
      expect(response.statusCode).toBe(200);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token)
        .get("/eservices")
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
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/eservices")
        .query(query as never);
      expect(response.statusCode).toBe(400);
    },
  );
});
