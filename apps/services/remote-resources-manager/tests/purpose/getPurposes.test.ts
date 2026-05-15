/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zocker } from "zocker";

import { API_Purpose } from "../../src/models/purpose/api.ts";
import { toK2KKnodeId, toK2KPurposeState } from "../k2kConverters.ts";
import { remoteResourceDbService } from "../setup.ts";
import { injectAppRequest } from "../utils.ts";

const getPurposesMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getPurposes: getPurposesMock,
    },
  };
});

const toK2KResult = (apiResult: API_Purpose): k2kGatewayApi.Purpose => ({
  consumer: {
    id: apiResult.consumer.id,
    knodeId: toK2KKnodeId(apiResult.consumer.knodeId),
  },
  dailyCalls: apiResult.dailyCalls,
  description: apiResult.description,
  eserviceId: apiResult.eserviceId,
  id: apiResult.id,
  name: apiResult.name,
  state: toK2KPurposeState(apiResult.state),
  suspendedByConsumerAt: apiResult.suspendedByConsumerAt,
  suspendedByProducerAt: apiResult.suspendedByProducerAt,
  template: apiResult.template
    ? {
        id: apiResult.template.id,
        knodeId: toK2KKnodeId(apiResult.template.knodeId),
      }
    : undefined,
  updatedAt: apiResult.updatedAt,
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /purposes (getPurposes)", () => {
  const defaultQuery = {
    limit: "10",
    offset: "0",
  };
  const parsedDefaultQuery = {
    limit: 10,
    offset: 0,
  };

  const expectedApiResult = zocker(API_Purpose).generate();
  const k2kResult = toK2KResult(expectedApiResult);

  const mockK2KResponse: k2kGatewayApi.Purposes = {
    pagination: { ...parsedDefaultQuery, total: 1 },
    results: [k2kResult],
  };

  beforeEach(async () => {
    getPurposesMock.mockReset();
    await remoteResourceDbService.insertPurpose({
      consumerId: TEST_ORGANIZATION_ID,
      eserviceId: expectedApiResult.eserviceId,
      knodeId: expectedApiResult.knodeId,
      purposeId: expectedApiResult.id,
    });
  });

  it("should return 200 with converted results on success", async () => {
    getPurposesMock.mockResolvedValue({
      data: mockK2KResponse,
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/purposes")
      .query(defaultQuery);

    expect(response.statusCode).toBe(200);

    expect(getPurposesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          consumerId: TEST_ORGANIZATION_ID,
          eserviceId: undefined,
          limit: parsedDefaultQuery.limit,
          offset: parsedDefaultQuery.offset,
          state: undefined,
        }),
      }),
    );

    expect(response.json()).toEqual({
      pagination: { ...parsedDefaultQuery, total: 1 },
      results: [expectedApiResult],
    });
  });

  it("should pass state filter to K2K gateway", async () => {
    getPurposesMock.mockResolvedValue({
      data: mockK2KResponse,
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/purposes")
      .query({ ...defaultQuery, state: "Active" });

    expect(response.statusCode).toBe(200);

    expect(getPurposesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          state: ["ACTIVE"],
        }),
      }),
    );
  });

  it("should pass multi-value state filter to K2K gateway", async () => {
    getPurposesMock.mockResolvedValue({
      data: mockK2KResponse,
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/purposes")
      .query({ ...defaultQuery, state: ["Active", "Suspended"] });

    expect(response.statusCode).toBe(200);

    expect(getPurposesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          state: ["ACTIVE", "SUSPENDED"],
        }),
      }),
    );
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .get("/purposes")
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
    { ...defaultQuery, eserviceId: "InvalidEserviceId" },
    { ...defaultQuery, state: "InvalidState" },
    {
      ...defaultQuery,
      invalidParam: "invalid",
    },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/purposes")
        .query(query as never);

      expect(response.statusCode).toBe(400);
    },
  );
});
