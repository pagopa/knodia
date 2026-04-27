/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { RemoteResourcePurposeSQL } from "@knodia/db-remote-resource";

import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { getMockPurpose } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { API_Purpose } from "../../src/models/purpose/api.ts";

import { toAPI_Purpose } from "../../src/models/purpose/apiConverter.ts";
import { toK2KPurpose } from "../k2kConverters.ts";
import { remoteResourceDbService } from "../setup.ts";
import { injectAppRequest } from "../utils.ts";

const suspendPurposeMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      suspendPurpose: suspendPurposeMock,
    },
  };
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const toRemoteResourcePurpose = (
  apiDetail: API_Purpose,
  consumerId: OrganizationId,
): RemoteResourcePurposeSQL => ({
  consumerId,
  eserviceId: apiDetail.eserviceId,
  knodeId: apiDetail.knodeId,
  purposeId: apiDetail.id,
});

const suspendPurpose = (
  purposeId: string,
  query: Record<string, string> = { knodeId: "Orion" },
  token: TestToken = allowedTestTokens[0]!,
) =>
  injectAppRequest(token).post(`/purposes/${purposeId}/suspend`).query(query);

describe("POST /purposes/:purposeId/suspend (suspendPurpose)", () => {
  const purpose = {
    ...getMockPurpose(),
    state: "Suspended" as const,
    suspendedByConsumerAt: new Date(),
    suspendedByProducerAt: null,
  };
  const k2kPurpose = toK2KPurpose(purpose);
  const expectedApiDetail = toAPI_Purpose(k2kPurpose, purpose.consumer.knodeId);
  const ownedPurpose = toRemoteResourcePurpose(
    expectedApiDetail,
    TEST_ORGANIZATION_ID,
  );
  const foreignPurpose = toRemoteResourcePurpose(
    toAPI_Purpose(toK2KPurpose(getMockPurpose(1)), "Orion"),
    generateId<OrganizationId>(),
  );
  const knodeId = expectedApiDetail.knodeId;

  beforeEach(async () => {
    suspendPurposeMock.mockReset();
    await remoteResourceDbService.insertPurpose(ownedPurpose);
    await remoteResourceDbService.insertPurpose(foreignPurpose);
  });

  it("should return 200 with converted detail on success", async () => {
    suspendPurposeMock.mockResolvedValue({ data: k2kPurpose });

    const response = await suspendPurpose(expectedApiDetail.id, { knodeId });

    expect(response.statusCode).toBe(200);

    expect(suspendPurposeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { purposeId: expectedApiDetail.id },
      }),
    );

    expect(response.json()).toEqual(expectedApiDetail);
  });

  it("should return 404 when Purpose is not found in remote resource DB", async () => {
    const response = await suspendPurpose(crypto.randomUUID(), { knodeId });

    expect(response.statusCode).toBe(404);
    expect(suspendPurposeMock).not.toHaveBeenCalled();
  });

  it("should return 403 when Purpose belongs to another consumer org", async () => {
    const response = await suspendPurpose(foreignPurpose.purposeId, {
      knodeId: foreignPurpose.knodeId,
    });

    expect(response.statusCode).toBe(403);
    expect(suspendPurposeMock).not.toHaveBeenCalled();
  });

  it("should return 403 if the organization does not exist", async () => {
    const response = await suspendPurpose(
      expectedApiDetail.id,
      { knodeId },
      {
        organizationId: generateId<OrganizationId>(),
        roles: ["administrative"],
        type: "ui-session",
      },
    );
    expect(response.statusCode).toBe(403);
    expect(suspendPurposeMock).not.toHaveBeenCalled();
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await suspendPurpose(
        expectedApiDetail.id,
        { knodeId },
        spec,
      );
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { purposeId: "not-a-uuid", query: { knodeId: "Orion" } },
    { purposeId: crypto.randomUUID(), query: {} },
    { purposeId: crypto.randomUUID(), query: { knodeId: "InvalidKnode" } },
  ])(
    "should return 400 if parameters are formatted incorrectly (%o)",
    async ({ purposeId, query }) => {
      const response = await suspendPurpose(
        purposeId,
        query as Record<string, string>,
      );

      expect(response.statusCode).toBe(400);
    },
  );
});
