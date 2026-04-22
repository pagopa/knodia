/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { API_MagicLink } from "@knodia/agreement-models/api";

import {
  generateId,
  KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { remoteResourceDbService } from "../setup.ts";
import { injectAppRequest } from "../utils.ts";

const createAgreementActivationMagicLinkMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      createAgreementActivationMagicLink:
        createAgreementActivationMagicLinkMock,
    },
  };
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /agreements/:agreementId/activationMagicLink (createAgreementActivationMagicLink)", () => {
  const agreementId = generateId();
  const knodeId = KnodeId.enum.Orion;
  const query: Record<string, string> = { knodeId };

  const mockMagicLink: API_MagicLink = {
    expiresAt: "2026-06-01T00:00:00.000Z",
    url: `https://producer.example/activate?token=abc.def.ghi`,
  };

  beforeEach(async () => {
    createAgreementActivationMagicLinkMock.mockReset();
    createAgreementActivationMagicLinkMock.mockResolvedValue({
      data: mockMagicLink,
    });
  });

  const seedAgreement = (overrides: { consumerId?: string } = {}) =>
    remoteResourceDbService.insertAgreement({
      agreementId,
      consumerId: overrides.consumerId ?? TEST_ORGANIZATION_ID,
      eserviceId: generateId(),
      eserviceVersionId: generateId(),
      knodeId,
      producerId: generateId(),
    });

  const makeRequest = (
    token: TestToken = allowedTestTokens[0]!,
    requestQuery: Record<string, unknown> = query,
    id: string = agreementId,
  ) =>
    injectAppRequest(token)
      .post(`/agreements/${id}/activationMagicLink`)
      .query(requestQuery as Record<string, string>);

  it("returns 200 and forwards the magic link from K2K when the agreement is owned by the caller", async () => {
    await seedAgreement();

    const response = await makeRequest();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(mockMagicLink);
    expect(createAgreementActivationMagicLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: { agreementId } }),
    );
  });

  it("returns 404 when the agreement is not in the RRM DB", async () => {
    const response = await makeRequest();

    expect(response.statusCode).toBe(404);
    expect(createAgreementActivationMagicLinkMock).not.toHaveBeenCalled();
  });

  it("returns 403 when the calling organization is not the agreement consumer", async () => {
    await seedAgreement({ consumerId: generateId<OrganizationId>() });

    const response = await makeRequest();

    expect(response.statusCode).toBe(403);
    expect(createAgreementActivationMagicLinkMock).not.toHaveBeenCalled();
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await makeRequest(spec);
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { requestQuery: {}, testCase: "missing knodeId" },
    {
      requestQuery: { knodeId: "InvalidKnode" },
      testCase: "invalid knodeId",
    },
    {
      requestQuery: { extra: "field", knodeId },
      testCase: "extra property",
    },
  ])("returns 400 for invalid query: $testCase", async ({ requestQuery }) => {
    const response = await makeRequest(allowedTestTokens[0]!, requestQuery);
    expect(response.statusCode).toBe(400);
    expect(createAgreementActivationMagicLinkMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the agreementId path param is not a UUID", async () => {
    const response = await makeRequest(
      allowedTestTokens[0]!,
      query,
      "not-a-uuid",
    );

    expect(response.statusCode).toBe(400);
    expect(createAgreementActivationMagicLinkMock).not.toHaveBeenCalled();
  });
});
