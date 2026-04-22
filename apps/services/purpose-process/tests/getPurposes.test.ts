/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type z from "zod";

import { AgreementState } from "@knodia/agreement-models";
import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import { splitPurposeIntoObjectsSQL } from "@knodia/db-readmodel-purpose/converters";
import { EserviceMode, EserviceVersionState } from "@knodia/eservice-models";
import { type Purpose, PurposeState } from "@knodia/purpose-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockAgreement, getMockEservice } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it } from "vitest";

import type { API_GetPurposesQueryParams } from "../src/models/api.ts";

import {
  consumerId1,
  consumerKnodeId1,
  createdAt,
  eserviceId1,
  eserviceId2,
  mockPurposes,
} from "./mockPurposes.ts";
import {
  agreementWriterService,
  eserviceWriterService,
  readmodelDb,
} from "./setup.ts";
import { injectAppRequest, toExpectAPI_Purpose } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
  { type: "internal" },
];

const eservice1 = {
  ...getMockEservice({ latestVersionState: EserviceVersionState.enum.Active }),
  id: eserviceId1,
  mode: EserviceMode.enum.ProvideData,
};
const eservice2 = {
  ...getMockEservice({
    latestVersionState: EserviceVersionState.enum.Active,
    seed: 1,
  }),
  id: eserviceId2,
  mode: EserviceMode.enum.ProvideData,
};

const agreement = {
  ...getMockAgreement({ seed: 20 }),
  consumer: { id: consumerId1, knodeId: consumerKnodeId1 },
  eserviceId: eserviceId1,
  eserviceVersionId: eservice1.versions[0]!.id,
  producerId: eservice1.producerId,
  state: AgreementState.enum.Active,
};

const seedAll = async () => {
  await Promise.all([
    ...mockPurposes.map((p, i) =>
      readmodelDb
        .insert(readmodelPurpose)
        .values(splitPurposeIntoObjectsSQL(p, i).purposeSQL),
    ),
    eserviceWriterService.upsertEservice(eservice1, 1),
    eserviceWriterService.upsertEservice(eservice2, 1),
    agreementWriterService.upsertAgreement(agreement, 1),
  ]);
};

describe("GET /purposes (getPurposes)", () => {
  const defaultQuery = {
    limit: "3",
    offset: "0",
  };

  beforeEach(async () => {
    await seedAll();
  });

  it.each([
    {
      expectedResult: [
        mockPurposes[4],
        mockPurposes[3],
        mockPurposes[2],
      ] as Purpose[],
      query: { ...defaultQuery },
      testCase: "pagination (1st page), sorted by updatedAt desc",
      totalCount: 5,
    },
    {
      expectedResult: [mockPurposes[1], mockPurposes[0]] as Purpose[],
      query: { limit: "3", offset: "3" },
      testCase: "pagination (2nd page), sorted by updatedAt desc",
      totalCount: 5,
    },
    {
      expectedResult: [
        mockPurposes[4],
        mockPurposes[1],
        mockPurposes[0],
      ] as Purpose[],
      query: { ...defaultQuery, consumerId: consumerId1 },
      testCase: "filter by consumerId",
      totalCount: 3,
    },
    {
      expectedResult: [
        mockPurposes[4],
        mockPurposes[1],
        mockPurposes[0],
      ] as Purpose[],
      query: { ...defaultQuery, consumerKnodeId: "Orion" },
      testCase: "filter by consumerKnodeId",
      totalCount: 3,
    },
    {
      expectedResult: [
        mockPurposes[2],
        mockPurposes[1],
        mockPurposes[0],
      ] as Purpose[],
      query: { ...defaultQuery, eserviceId: eserviceId1 },
      testCase: "filter by eserviceId",
      totalCount: 3,
    },
    {
      expectedResult: [
        mockPurposes[4],
        mockPurposes[1],
        mockPurposes[0],
      ] as Purpose[],
      query: { ...defaultQuery, state: [PurposeState.enum.Active] },
      testCase: "filter by single state",
      totalCount: 3,
    },
    {
      expectedResult: [mockPurposes[3], mockPurposes[2]] as Purpose[],
      query: {
        ...defaultQuery,
        state: [PurposeState.enum.Suspended, PurposeState.enum.Archived],
      },
      testCase: "filter by multiple states",
      totalCount: 2,
    },
    {
      expectedResult: [
        mockPurposes[2],
        mockPurposes[1],
        mockPurposes[0],
      ] as Purpose[],
      query: { ...defaultQuery, producerId: eservice1.producerId },
      testCase: "filter by producerId",
      totalCount: 3,
    },
    {
      expectedResult: [mockPurposes[1], mockPurposes[0]] as Purpose[],
      query: { ...defaultQuery, agreementId: agreement.id },
      testCase: "filter by agreementId",
      totalCount: 2,
    },
    {
      expectedResult: [mockPurposes[4], mockPurposes[3]] as Purpose[],
      query: {
        ...defaultQuery,
        updatedSince: new Date(createdAt.getTime() + 3500).toISOString(),
      },
      testCase:
        "filter by updatedSince, only purposes updated at or after cutoff",
      totalCount: 2,
    },
    {
      expectedResult: [
        mockPurposes[4],
        mockPurposes[3],
        mockPurposes[2],
      ] as Purpose[],
      query: {
        ...defaultQuery,
        updatedSince: mockPurposes[2]!.updatedAt.toISOString(),
      },
      testCase: "filter by updatedSince at exact boundary (inclusive)",
      totalCount: 3,
    },
  ] satisfies {
    expectedResult: Purpose[];
    query: z.input<typeof API_GetPurposesQueryParams>;
    testCase: string;
    totalCount: number;
  }[])(
    "should return purposes with correct shape and pagination: $testCase (seed #%#)",
    async ({ expectedResult, query, totalCount }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/purposes")
        .query(query);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        pagination: {
          limit: Number(query.limit),
          offset: Number(query.offset),
          total: totalCount,
        },
        results: expectedResult.map((p) => toExpectAPI_Purpose(p)),
      });
    },
  );

  it.each([
    { limit: "abc", offset: "0" },
    { limit: "0", offset: "0" },
    { limit: "51", offset: "0" },
    { limit: "10", offset: "-1" },
    { ...defaultQuery, consumerKnodeId: "InvalidConsumerKnodeId" },
    { ...defaultQuery, producerId: "InvalidProducerId" },
    { ...defaultQuery, eserviceId: "InvalidEserviceId" },
    { ...defaultQuery, agreementId: "InvalidAgreementId" },
    { ...defaultQuery, state: ["InvalidState"] },
    { ...defaultQuery, updatedSince: "not-a-date" },
    { ...defaultQuery, invalidParam: "invalid" },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/purposes")
        .query(query as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .get("/purposes")
        .query(defaultQuery);
      expect(response.statusCode).toBe(403);
    },
  );
});
