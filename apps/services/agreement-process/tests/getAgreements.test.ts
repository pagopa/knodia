/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Agreement } from "@knodia/agreement-models";
import type z from "zod";

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeAll, describe, expect, it } from "vitest";

import type { API_GetAgreementsQueryParams } from "../src/models/api.ts";

import {
  consumerId,
  eservice1,
  eservice2,
  mockAgreements,
} from "./mockAgreements.ts";
import { agreementWriterService, eserviceWriterService } from "./setup.ts";
import { injectAppRequest, toExpectAPI_Agreement } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
  { type: "internal" },
];

describe("GET /agreements (getAgreements)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  beforeAll(async () => {
    await Promise.all([
      ...mockAgreements.map((agreement) =>
        agreementWriterService.upsertAgreement(agreement, 0),
      ),
      eserviceWriterService.upsertEservice(eservice1, 0),
      eserviceWriterService.upsertEservice(eservice2, 0),
    ]);
  });

  it.each([
    {
      expectedResult: [
        mockAgreements[9],
        mockAgreements[8],
        mockAgreements[7],
        mockAgreements[6],
      ] as Agreement[],
      query: { ...defaultQuery },
      testCase: "pagination only (1st page), sort by updatedAt desc by default",
      totalCount: 10,
    },
    {
      expectedResult: [
        mockAgreements[5],
        mockAgreements[4],
        mockAgreements[3],
        mockAgreements[2],
      ] as Agreement[],
      query: {
        limit: "4",
        offset: "4",
      },
      testCase: "pagination only (2nd page), sort by updatedAt desc by default",
      totalCount: 10,
    },
    {
      expectedResult: [
        mockAgreements[4],
        mockAgreements[3],
        mockAgreements[2],
        mockAgreements[1],
      ] as Agreement[],
      query: { ...defaultQuery, consumerId },
      testCase: "filter by consumerId, sort by updatedAt desc by default",
      totalCount: 5,
    },
    {
      expectedResult: [
        mockAgreements[5],
        mockAgreements[4],
        mockAgreements[3],
      ] as Agreement[],
      query: { ...defaultQuery, consumerKnodeId: "Lynx" },
      testCase: "filter by consumerKnodeId, sort by updatedAt desc by default",
      totalCount: 3,
    },
    {
      expectedResult: [
        mockAgreements[8],
        mockAgreements[3],
        mockAgreements[2],
      ] as Agreement[],
      query: {
        ...defaultQuery,
        state: "Archived",
      },
      testCase: "filter by state, sort by updatedAt desc by default",
      totalCount: 3,
    },
    {
      expectedResult: [mockAgreements[1]] as Agreement[],
      query: {
        ...defaultQuery,
        consumerId,
        consumerKnodeId: "Orion",
        state: "Suspended",
      },
      testCase: "full query",
      totalCount: 1,
    },
  ] satisfies {
    expectedResult: Agreement[];
    query: z.input<typeof API_GetAgreementsQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return agreements with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, query, totalCount }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/agreements")
        .query(query);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        items: expectedResult.map((a) => toExpectAPI_Agreement(a)),
        pagination: {
          limit: Number(query.limit),
          offset: Number(query.offset),
          total: totalCount,
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
      state: "InvalidState",
    },
    { ...defaultQuery, consumerId: "InvalidConsumerId" },
    { ...defaultQuery, consumerKnodeId: "InvalidConsumerKnodeId" },
    { ...defaultQuery, eserviceId: "InvalidEserviceId" },
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
        .get("/agreements")
        .query(query as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .get("/agreements")
        .query(defaultQuery);
      expect(response.statusCode).toBe(403);
    },
  );
});
