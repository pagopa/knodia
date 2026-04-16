/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { RemoteResourceAgreementSQL } from "@knodia/db-remote-resource";

import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { getMockAgreement } from "@knodia/test-commons/utils";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { API_Agreement } from "../../src/models/agreement/api.ts";

import { toAPI_Agreement } from "../../src/models/agreement/apiConverter.ts";
import { toK2KAgreement } from "../k2kConverters.ts";
import { remoteResourceDbService } from "../setup.ts";
import { injectAppRequest } from "../utils.ts";

const reactivateAgreementMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      reactivateAgreement: reactivateAgreementMock,
    },
  };
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const toRemoteResourceAgreement = (
  apiDetail: API_Agreement,
  consumerId: OrganizationId,
): RemoteResourceAgreementSQL => ({
  agreementId: apiDetail.id,
  consumerId,
  eserviceId: apiDetail.eserviceId,
  eserviceVersionId: apiDetail.eserviceVersionId,
  knodeId: apiDetail.consumer.knodeId,
  producerId: apiDetail.producerId,
});

const reactivateAgreement = (
  agreementId: string,
  query: Record<string, string> = { knodeId: "Orion" },
  token: TestToken = allowedTestTokens[0]!,
) =>
  injectAppRequest(token)
    .post(`/agreements/${agreementId}/reactivate`)
    .query(query);

describe("POST /agreements/:agreementId/reactivate (reactivateAgreement)", () => {
  const agreement = getMockAgreement({ state: "Active" });
  const k2kAgreement = toK2KAgreement(agreement);
  const expectedApiDetail = toAPI_Agreement(k2kAgreement);
  const ownedAgreement = toRemoteResourceAgreement(
    expectedApiDetail,
    TEST_ORGANIZATION_ID,
  );
  const foreignAgreement = toRemoteResourceAgreement(
    toAPI_Agreement(toK2KAgreement(getMockAgreement({ seed: 1 }))),
    generateId<OrganizationId>(),
  );
  const knodeId = expectedApiDetail.consumer.knodeId;

  beforeAll(async () => {
    await remoteResourceDbService.insertAgreement(ownedAgreement);
    await remoteResourceDbService.insertAgreement(foreignAgreement);
  });

  beforeEach(() => {
    reactivateAgreementMock.mockReset();
  });

  it("should return 200 with converted detail on success", async () => {
    reactivateAgreementMock.mockResolvedValue({ data: k2kAgreement });

    const response = await reactivateAgreement(expectedApiDetail.id, {
      knodeId,
    });

    expect(response.statusCode).toBe(200);

    expect(reactivateAgreementMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { agreementId: expectedApiDetail.id },
      }),
    );

    expect(response.json()).toEqual(expectedApiDetail);
  });

  it("should return 404 when Agreement is not found in remote resource DB", async () => {
    const response = await reactivateAgreement(crypto.randomUUID(), {
      knodeId,
    });

    expect(response.statusCode).toBe(404);
    expect(reactivateAgreementMock).not.toHaveBeenCalled();
  });

  it("should return 404 when Agreement belongs to another consumer org", async () => {
    const response = await reactivateAgreement(foreignAgreement.agreementId, {
      knodeId: foreignAgreement.knodeId,
    });

    expect(response.statusCode).toBe(404);
    expect(reactivateAgreementMock).not.toHaveBeenCalled();
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await reactivateAgreement(
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
      const response = await reactivateAgreement(
        agreementId,
        query as Record<string, string>,
      );

      expect(response.statusCode).toBe(400);
    },
  );
});
