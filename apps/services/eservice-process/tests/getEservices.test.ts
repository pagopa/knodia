import { SortDirection } from "@knodia/db-readmodel-commons";
import {
  Eservice,
  EserviceMode,
  EserviceVersionState,
} from "@knodia/eservice-models";
import { toExpectAPI_Eservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { mockEservices, producerId } from "./mockEservices.ts";
import { injectAppRequest } from "./utils.ts";

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
      name: "pagination only (1st page), sort by name asc by default",
      query: { ...defaultQuery },
    },
    {
      expectedResult: [
        mockEservices[1],
        mockEservices[2],
        mockEservices[3],
        mockEservices[4],
      ] as Eservice[],
      name: "pagination only (1st page), sort by name asc by default",
      query: { ...defaultQuery, producerId },
    },
    {
      expectedResult: [
        mockEservices[4],
        mockEservices[5],
        mockEservices[6],
        mockEservices[7],
      ] as Eservice[],
      name: "pagination only (2nd page), sort by name asc by default",
      query: {
        limit: "4",
        offset: "4",
      },
    },
    {
      expectedResult: [mockEservices[1], mockEservices[3]] as Eservice[],
      name: "search query",
      query: { ...defaultQuery, producerId, q: "KNODIA" },
    },
    {
      expectedResult: [
        mockEservices[1],
        mockEservices[4],
        mockEservices[7],
      ] as Eservice[],
      name: "filter by mode",
      query: {
        ...defaultQuery,
        mode: EserviceMode.enum.ProvideData,
        producerId,
      },
    },
    {
      expectedResult: [
        mockEservices[1],
        mockEservices[2],
        mockEservices[4],
        mockEservices[5],
      ] as Eservice[],
      name: "filter by state",
      query: {
        ...defaultQuery,
        producerId,
        state: [
          EserviceVersionState.enum.Active,
          EserviceVersionState.enum.Suspended,
        ],
      },
    },
    {
      expectedResult: [
        mockEservices[9],
        mockEservices[8],
        mockEservices[7],
        mockEservices[6],
      ] as Eservice[],
      name: "sort by name desc",
      query: {
        ...defaultQuery,
        producerId,
        sortBy: "name",
        sortOrder: SortDirection.enum.desc,
      },
    },
    {
      expectedResult: [mockEservices[1]] as Eservice[],
      name: "full query",
      query: {
        ...defaultQuery,
        mode: EserviceMode.enum.ProvideData,
        producerId,
        q: "knodia",
        sortBy: "name",
        sortOrder: SortDirection.enum.desc,
        state: EserviceVersionState.enum.Suspended,
      },
    },
  ] satisfies {
    expectedResult: Eservice[];
    name: string;
    query: unknown;
  }[])(
    "should return mock e-services correctly: $name (seed #%#)",
    async ({ expectedResult, query }) => {
      const response = await injectAppRequest()
        .get("/eservices")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .query(query as any);

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
    { limit: "abc", offset: "abc" },
    { limit: "10", offset: "abc" },
    { limit: new Date(), offset: NaN },
    { limit: 9999999, offset: 9999999 },
    {
      ...defaultQuery,
      state: "InvalidState",
    },
    { ...defaultQuery, mode: "InvalidMode" },
    {
      ...defaultQuery,
      sortBy: "InvalidSortBy",
    },
    {
      ...defaultQuery,
      sortOrder: "InvalidSortOrder",
      state: ["InvalidState"],
    },
    // { ...defaultQuery, q: false },
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
