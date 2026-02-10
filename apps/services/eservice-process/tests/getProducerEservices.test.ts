import { SortDirection } from "@knodia/db-readmodel-commons";
import {
  Eservice,
  EserviceMode,
  EserviceVersionState,
} from "@knodia/eservice-models";
import { toExpectProducerEservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { mockEservices } from "./mockEservices.ts";
import { injectAppRequest } from "./utils.ts";

describe("GET /producer/eservices (getProducerEservices)", () => {
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
      name: "pagination only",
      query: {
        ...defaultQuery,
      },
    },
    {
      expectedResult: [
        mockEservices[0],
        mockEservices[1],
        mockEservices[3],
      ] as Eservice[],
      name: "search query",
      query: { ...defaultQuery, q: "KNODIA" },
    },
    {
      expectedResult: [
        mockEservices[0],
        mockEservices[1],
        mockEservices[4],
        mockEservices[7],
      ] as Eservice[],
      name: "filter by mode",
      query: { ...defaultQuery, mode: EserviceMode.enum.ProvideData },
    },
    {
      expectedResult: [
        mockEservices[5],
        mockEservices[6],
        mockEservices[9],
      ] as Eservice[],
      name: "filter by status",
      query: { ...defaultQuery, status: EserviceVersionState.enum.Active },
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
        sortBy: "name",
        sortOrder: SortDirection.enum.desc,
      },
    },
    {
      expectedResult: [
        mockEservices[9],
        mockEservices[8],
        mockEservices[7],
        mockEservices[6],
      ] as Eservice[],
      name: "sort by activeAgreements desc",
      query: {
        ...defaultQuery,
        sortBy: "name",
        sortOrder: SortDirection.enum.desc,
      },
    },
    {
      expectedResult: [mockEservices[1], mockEservices[0]] as Eservice[],
      name: "full query",
      query: {
        ...defaultQuery,
        mode: EserviceMode.enum.ProvideData,
        q: "knodia",
        sortBy: "name",
        sortOrder: SortDirection.enum.desc,
        status: EserviceVersionState.enum.Suspended,
      },
    },
  ] satisfies {
    expectedResult: Eservice[];
    name: string;
    query: unknown;
  }[])(
    "should return mock e-services correctly",
    async ({ expectedResult, query }) => {
      const response = await injectAppRequest()
        .get("/producer/eservices")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .query(query as any);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        items: expectedResult.map((e) => toExpectProducerEservice(e)),
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
      status: "InvalidStatus",
    },
    { ...defaultQuery, mode: "InvalidMode", status: "InvalidStatus" },
    {
      ...defaultQuery,
      sortBy: "InvalidSortBy",
      status: "InvalidStatus",
    },
    {
      ...defaultQuery,
      sortOrder: "InvalidSortOrder",
      status: "InvalidStatus",
    },
    { ...defaultQuery, q: 123, status: "InvalidStatus" },
    {
      ...defaultQuery,
      invalidParam: "invalid",
    },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await injectAppRequest()
        .get("/producer/eservices")
        .query(query as never);
      expect(response.statusCode).toBe(400);
    },
  );
});
