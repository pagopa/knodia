/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { KnodeId } from "@knodia/common-models/ids";
import type { RemoteResourceAgreementSQL } from "@knodia/db-remote-resource";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zocker } from "zocker";

import { API_Agreement } from "../../src/models/agreement/api.ts";
import { toK2KAPI_AgreementState } from "../../src/models/agreement/apiConverter.ts";
import { toK2KKnodeId } from "../k2kConverters.ts";
import { remoteResourceDbService } from "../setup.ts";
import { injectAppRequest } from "../utils.ts";

const getAgreementsMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getAgreements: getAgreementsMock,
    },
  };
});

const toK2KResult = (apiResult: API_Agreement): k2kGatewayApi.Agreement => ({
  attributes: apiResult.attributes,
  consumer: {
    id: apiResult.consumer.id,
    knodeId: toK2KKnodeId(apiResult.consumer.knodeId),
  },
  eserviceId: apiResult.eserviceId,
  eserviceVersionId: apiResult.eserviceVersionId,
  id: apiResult.id,
  producerId: apiResult.producerId,
  state: toK2KAPI_AgreementState(apiResult.state),
  suspendedByConsumerAt: apiResult.suspendedByConsumerAt,
  suspendedByProducerAt: apiResult.suspendedByProducerAt,
  updatedAt: apiResult.updatedAt,
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /agreements (getAgreements)", () => {
  const defaultQuery = {
    limit: "10",
    offset: "0",
  };
  const parsedDefaultQuery = {
    limit: 10,
    offset: 0,
  };

  const knodeId: KnodeId = "Orion";

  const expectedApiResult = { ...zocker(API_Agreement).generate(), knodeId };
  const k2kResult = toK2KResult(expectedApiResult);

  const mockK2KResponse: k2kGatewayApi.Agreements = {
    pagination: { ...parsedDefaultQuery, total: 1 },
    results: [k2kResult],
  };

  const remoteAgreement: RemoteResourceAgreementSQL = {
    agreementId: expectedApiResult.id,
    consumerId: TEST_ORGANIZATION_ID,
    eserviceId: expectedApiResult.eserviceId,
    eserviceVersionId: expectedApiResult.eserviceVersionId,
    knodeId,
    producerId: expectedApiResult.producerId,
  };

  beforeEach(() => {
    getAgreementsMock.mockReset();
  });

  it("should return 200 with converted results on success", async () => {
    getAgreementsMock.mockResolvedValue({
      data: mockK2KResponse,
    });

    await remoteResourceDbService.insertAgreement(remoteAgreement);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/agreements")
      .query({ ...defaultQuery, state: [expectedApiResult.state] });

    expect(response.statusCode).toBe(200);

    expect(getAgreementsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: {
          ...parsedDefaultQuery,
          consumerId: TEST_ORGANIZATION_ID,
          state: [toK2KAPI_AgreementState(expectedApiResult.state)],
        },
      }),
    );

    expect(response.json()).toEqual({
      pagination: { ...parsedDefaultQuery, total: 1 },
      results: [expectedApiResult],
    });
  });

  it("forwards a multi-state filter to the k2k-gateway as an array", async () => {
    getAgreementsMock.mockResolvedValue({
      data: { ...mockK2KResponse, results: [] },
    });

    await remoteResourceDbService.insertAgreement(remoteAgreement);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get("/agreements")
      .query({ ...defaultQuery, state: ["Active", "Suspended"] });

    expect(response.statusCode).toBe(200);
    expect(getAgreementsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          state: [
            toK2KAPI_AgreementState("Active"),
            toK2KAPI_AgreementState("Suspended"),
          ],
        }),
      }),
    );
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .get("/agreements")
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
      state: "InvalidState",
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
});
