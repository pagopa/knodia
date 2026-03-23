/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockAgreement } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { API_Agreement } from "../src/models/agreement/api.ts";

import { toAPI_Agreement } from "../src/models/agreement/apiConverter.ts";
import { toK2KAgreement } from "./k2kConverters.ts";
import { injectAppRequest } from "./utils.ts";

const getAgreementMock = vi.hoisted(() => vi.fn());
const getAgreementByIdMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getAgreement: getAgreementMock,
    },
  };
});

vi.mock("@knodia/db-remote-resource/services", () => ({
  remoteResourceDbServiceBuilder: () => ({
    getAgreementById: getAgreementByIdMock,
    insertAgreement: vi.fn(),
  }),
}));

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const toRemoteResourceAgreement = (apiDetail: API_Agreement) => ({
  agreementId: apiDetail.id,
  consumerId: apiDetail.consumer.id,
  eserviceId: apiDetail.eserviceId,
  eserviceVersionId: apiDetail.eserviceVersionId,
  knodeId: apiDetail.consumer.knodeId,
  producerId: apiDetail.producerId,
});

const getAgreement = (
  agreementId: string,
  query: Record<string, string> = { knodeId: "Orion" },
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/agreements/${agreementId}`).query(query);

describe("GET /agreements/:agreementId (getAgreement)", () => {
  const agreement = getMockAgreement();
  const k2kAgreement = toK2KAgreement(agreement);
  const expectedApiDetail = toAPI_Agreement(k2kAgreement);
  const remoteResourceAgreement = toRemoteResourceAgreement(expectedApiDetail);
  const knodeId = expectedApiDetail.consumer.knodeId;

  beforeEach(() => {
    getAgreementMock.mockReset();
    getAgreementByIdMock.mockReset();
  });

  it("should return 200 with converted detail on success", async () => {
    getAgreementByIdMock.mockResolvedValue(remoteResourceAgreement);
    getAgreementMock.mockResolvedValue({ data: k2kAgreement });

    const response = await getAgreement(expectedApiDetail.id, { knodeId });

    expect(response.statusCode).toBe(200);

    expect(getAgreementMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { agreementId: expectedApiDetail.id },
      }),
    );

    expect(response.json()).toEqual(expectedApiDetail);
  });

  it("should return 404 when Agreement is not found in remote resource DB", async () => {
    getAgreementByIdMock.mockResolvedValue(undefined);

    const response = await getAgreement(crypto.randomUUID(), { knodeId });

    expect(response.statusCode).toBe(404);
    expect(getAgreementMock).not.toHaveBeenCalled();
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await getAgreement(
        expectedApiDetail.id,
        { knodeId },
        spec,
      );
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { agreementId: "not-a-uuid", query: { knodeId: "Orion" } },
    { agreementId: crypto.randomUUID(), query: {} },
    { agreementId: crypto.randomUUID(), query: { knodeId: "InvalidKnode" } },
  ])(
    "should return 400 if parameters are formatted incorrectly (%o)",
    async ({ agreementId, query }) => {
      const response = await getAgreement(
        agreementId,
        query as Record<string, string>,
      );

      expect(response.statusCode).toBe(400);
    },
  );
});
