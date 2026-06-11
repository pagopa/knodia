/* eslint-disable max-lines-per-function */
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

  it("forwards offset/limit unchanged to the single knode (no per-node reset)", async () => {
    getPurposesMock.mockResolvedValue({
      data: {
        pagination: { limit: 5, offset: 5, total: 12 },
        results: [k2kResult],
      },
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/purposes")
      .query({ limit: "5", offset: "5" });

    expect(response.statusCode).toBe(200);
    expect(getPurposesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ limit: 5, offset: 5 }),
      }),
    );
    expect(response.json().pagination).toEqual({
      limit: 5,
      offset: 5,
      total: 12,
    });
  });

  it("returns 501 when the consumer has purposes on more than one knode", async () => {
    const otherKnodeId =
      expectedApiResult.knodeId === "Orion" ? "Lynx" : "Orion";
    await remoteResourceDbService.insertPurpose({
      consumerId: TEST_ORGANIZATION_ID,
      eserviceId: zocker(API_Purpose).generate().eserviceId,
      knodeId: otherKnodeId,
      purposeId: zocker(API_Purpose).generate().id,
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/purposes")
      .query(defaultQuery);

    expect(response.statusCode).toBe(501);
    expect(getPurposesMock).not.toHaveBeenCalled();
  });

  it("does not 501 when knodeId scopes a multi-knode consumer to a single knode", async () => {
    getPurposesMock.mockResolvedValue({ data: mockK2KResponse });

    // Consumer also has purposes on another knode.
    const otherKnodeId =
      expectedApiResult.knodeId === "Orion" ? "Lynx" : "Orion";
    await remoteResourceDbService.insertPurpose({
      consumerId: TEST_ORGANIZATION_ID,
      eserviceId: zocker(API_Purpose).generate().eserviceId,
      knodeId: otherKnodeId,
      purposeId: zocker(API_Purpose).generate().id,
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/purposes")
      .query({
        ...defaultQuery,
        eserviceId: expectedApiResult.eserviceId,
        knodeId: expectedApiResult.knodeId,
      });

    expect(response.statusCode).toBe(200);
    expect(getPurposesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          eserviceId: expectedApiResult.eserviceId,
        }),
      }),
    );
  });

  it("targets the requested knode even when the local readmodel has no purposes for it", async () => {
    getPurposesMock.mockResolvedValue({
      data: { pagination: { ...parsedDefaultQuery, total: 0 }, results: [] },
    });

    const otherKnodeId =
      expectedApiResult.knodeId === "Orion" ? "Lynx" : "Orion";

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/purposes")
      .query({ ...defaultQuery, knodeId: otherKnodeId });

    expect(response.statusCode).toBe(200);
    expect(getPurposesMock).toHaveBeenCalledTimes(1);
  });

  it("should return 400 when eserviceId is passed without knodeId", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/purposes")
      .query({ ...defaultQuery, eserviceId: expectedApiResult.eserviceId });

    expect(response.statusCode).toBe(400);
    expect(getPurposesMock).not.toHaveBeenCalled();
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
    { ...defaultQuery, knodeId: "InvalidKnodeId" },
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
