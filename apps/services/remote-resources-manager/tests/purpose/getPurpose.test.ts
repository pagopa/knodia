/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { RemoteResourcePurposeSQL } from "@knodia/db-remote-resource";

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockPurpose } from "@knodia/test-commons/utils";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { API_Purpose } from "../../src/models/purpose/api.ts";

import { toAPI_Purpose } from "../../src/models/purpose/apiConverter.ts";
import { toK2KPurpose } from "../k2kConverters.ts";
import { remoteResourceDbService } from "../setup.ts";
import { injectAppRequest } from "../utils.ts";

const getPurposeMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getPurpose: getPurposeMock,
    },
  };
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const toRemoteResourcePurpose = (
  apiDetail: API_Purpose,
): RemoteResourcePurposeSQL => ({
  consumerId: apiDetail.consumer.id,
  eserviceId: apiDetail.eserviceId,
  knodeId: apiDetail.knodeId,
  purposeId: apiDetail.id,
});

const getPurpose = (
  purposeId: string,
  query: Record<string, string> = { knodeId: "Orion" },
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/purposes/${purposeId}`).query(query);

describe("GET /purposes/:purposeId (getPurpose)", () => {
  const purpose = getMockPurpose();
  const k2kPurpose = toK2KPurpose(purpose);
  const expectedApiDetail = toAPI_Purpose(k2kPurpose, purpose.consumer.knodeId);
  const remoteResourcePurpose = toRemoteResourcePurpose(expectedApiDetail);
  const knodeId = expectedApiDetail.consumer.knodeId;

  beforeAll(async () => {
    await remoteResourceDbService.insertPurpose(remoteResourcePurpose);
  });

  beforeEach(() => {
    getPurposeMock.mockReset();
  });

  it("should return 200 with converted detail on success", async () => {
    getPurposeMock.mockResolvedValue({ data: k2kPurpose });

    const response = await getPurpose(expectedApiDetail.id, { knodeId });

    expect(response.statusCode).toBe(200);

    expect(getPurposeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { purposeId: expectedApiDetail.id },
      }),
    );

    expect(response.json()).toEqual(expectedApiDetail);
  });

  it("should return 404 when Purpose is not found in remote resource DB", async () => {
    const response = await getPurpose(crypto.randomUUID(), { knodeId });

    expect(response.statusCode).toBe(404);
    expect(getPurposeMock).not.toHaveBeenCalled();
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await getPurpose(
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
      const response = await getPurpose(
        purposeId,
        query as Record<string, string>,
      );

      expect(response.statusCode).toBe(400);
    },
  );
});
