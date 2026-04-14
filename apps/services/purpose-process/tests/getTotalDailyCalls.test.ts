/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type z from "zod";

import { type EserviceId, generateId } from "@knodia/common-models/ids";
import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import { splitPurposeIntoObjectsSQL } from "@knodia/db-readmodel-purpose/converters";
import { PurposeState } from "@knodia/purpose-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it } from "vitest";

import type { API_GetTotalDailyCallsQueryParams } from "../src/models/api.ts";

import { eserviceId1, eserviceId2, mockPurposes } from "./mockPurposes.ts";
import { readmodelDb } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
  { type: "internal" },
];

const seedAll = async () => {
  await Promise.all(
    mockPurposes.map((p, i) =>
      readmodelDb
        .insert(readmodelPurpose)
        .values(splitPurposeIntoObjectsSQL(p, i).purposeSQL),
    ),
  );
};

describe("GET /purposes/totalDailyCalls (getTotalDailyCalls)", () => {
  beforeEach(async () => {
    await seedAll();
  });

  it.each([
    {
      expectedTotalDailyCalls: 1500,
      query: {
        eserviceId: eserviceId1,
        state: [PurposeState.enum.Active],
      },
      testCase: "active purposes for eserviceId1",
    },
    {
      expectedTotalDailyCalls: 100,
      query: {
        eserviceId: eserviceId2,
        state: [PurposeState.enum.Active],
      },
      testCase: "active purposes for eserviceId2",
    },
    {
      expectedTotalDailyCalls: 200,
      query: {
        eserviceId: eserviceId1,
        state: [PurposeState.enum.Suspended],
      },
      testCase: "suspended purposes for eserviceId1",
    },
    {
      expectedTotalDailyCalls: 1700,
      query: {
        eserviceId: eserviceId1,
        state: [PurposeState.enum.Active, PurposeState.enum.Suspended],
      },
      testCase: "active + suspended purposes for eserviceId1",
    },
    {
      expectedTotalDailyCalls: 0,
      query: {
        eserviceId: generateId<EserviceId>(),
        state: [PurposeState.enum.Active],
      },
      testCase: "non-existent eserviceId returns 0",
    },
  ] satisfies {
    expectedTotalDailyCalls: number;
    query: z.input<typeof API_GetTotalDailyCallsQueryParams>;
    testCase: string;
  }[])(
    "should return correct total daily calls: $testCase",
    async ({ expectedTotalDailyCalls, query }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/purposes/totalDailyCalls")
        .query(query);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        totalDailyCalls: expectedTotalDailyCalls,
      });
    },
  );

  it("should return total daily calls for all purposes when no state filter is provided", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/purposes/totalDailyCalls")
      .query({ eserviceId: eserviceId1 });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ totalDailyCalls: 1700 });
  });

  it.each([
    {},
    { eserviceId: "InvalidEserviceId" },
    { eserviceId: eserviceId1, state: ["InvalidState"] },
    { eserviceId: eserviceId1, invalidParam: "invalid" },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/purposes/totalDailyCalls")
        .query(query as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .get("/purposes/totalDailyCalls")
        .query({ eserviceId: eserviceId1 });
      expect(response.statusCode).toBe(403);
    },
  );
});
