/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockEservice,
  getMockOrganization,
} from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toAPI_EserviceDetails } from "../../src/models/eservice/apiConverter.ts";
import {
  toK2KEservice,
  toK2KEserviceVersion,
  toK2KKnodeId,
  toK2KOrganization,
} from "../k2kConverters.ts";
import { injectAppRequest } from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getEserviceMock = vi.hoisted(() => vi.fn());
const getEserviceLatestVersionMock = vi.hoisted(() => vi.fn());
const getOrganizationMock = vi.hoisted(() => vi.fn());
const getAgreementsMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getAgreements: getAgreementsMock,
      getEservice: getEserviceMock,
      getEserviceLatestVersion: getEserviceLatestVersionMock,
      getOrganization: getOrganizationMock,
    },
  };
});

describe("GET /eservices/:eserviceId (getEserviceDetails)", () => {
  const eserviceId = crypto.randomUUID();
  const knodeId: API_KnodeId = "Orion";

  const eservice = getMockEservice({ latestVersionState: "Active" });
  const eserviceVersion = eservice.versions[0]!;
  const k2kEservice = toK2KEservice(eservice);
  const k2kVersion = toK2KEserviceVersion(eserviceVersion);

  const organization = getMockOrganization();
  const k2kOrganization = toK2KOrganization(organization);

  const expectedApiDetail = toAPI_EserviceDetails(k2kEservice, k2kVersion, {
    ...k2kOrganization,
    knodeId,
  });

  const emptyAgreementsResponse = {
    pagination: { limit: 1, offset: 0, total: 0 },
    results: [],
  };

  const expectedAgreementsQuery = {
    consumerId: TEST_ORGANIZATION_ID,
    eserviceId,
    limit: 1,
    offset: 0,
    state: "ACTIVE",
  };

  const buildK2KAgreement = (
    overrides: Partial<k2kGatewayApi.Agreement> &
      Pick<k2kGatewayApi.Agreement, "id" | "state">,
  ): k2kGatewayApi.Agreement => ({
    attributes: [],
    consumer: { id: TEST_ORGANIZATION_ID, knodeId: toK2KKnodeId(knodeId) },
    eserviceId,
    eserviceVersionId: crypto.randomUUID(),
    producerId: k2kEservice.producerId,
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    getEserviceMock.mockReset();
    getEserviceLatestVersionMock.mockReset();
    getOrganizationMock.mockReset();
    getAgreementsMock.mockReset();
  });

  const expectedPath = { eserviceId };

  it("should return 200 with no agreement when none exists", async () => {
    getEserviceMock.mockResolvedValue({ data: k2kEservice });
    getEserviceLatestVersionMock.mockResolvedValue({ data: k2kVersion });
    getOrganizationMock.mockResolvedValue({ data: k2kOrganization });
    getAgreementsMock.mockResolvedValue({ data: emptyAgreementsResponse });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/eservices/${eserviceId}`)
      .query({ knodeId });

    expect(response.statusCode).toBe(200);

    expect(getEserviceMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: expectedPath }),
    );
    expect(getEserviceLatestVersionMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: expectedPath }),
    );
    expect(getOrganizationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { organizationId: k2kEservice.producerId },
      }),
    );
    expect(getAgreementsMock).toHaveBeenCalledWith(
      expect.objectContaining({ query: expectedAgreementsQuery }),
    );

    const body = response.json();
    expect(body.agreement).toBeUndefined();
    expect(body).toEqual({
      ...expectedApiDetail,
      producer: {
        email: "info@example.com",
        id: k2kOrganization.id,
        knodeId,
        name: k2kOrganization.name,
        notes: "Notes",
      },
    });
  });

  it("should return 200 with agreement when an active one exists", async () => {
    const k2kAgreement = buildK2KAgreement({
      id: crypto.randomUUID(),
      state: "ACTIVE",
    });

    getEserviceMock.mockResolvedValue({ data: k2kEservice });
    getEserviceLatestVersionMock.mockResolvedValue({ data: k2kVersion });
    getOrganizationMock.mockResolvedValue({ data: k2kOrganization });
    getAgreementsMock.mockResolvedValue({
      data: {
        pagination: { limit: 1, offset: 0, total: 1 },
        results: [k2kAgreement],
      },
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/eservices/${eserviceId}`)
      .query({ knodeId });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.agreement).toEqual({
      id: k2kAgreement.id,
      state: "Active",
      updatedAt: k2kAgreement.updatedAt,
    });
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .get(`/eservices/${eserviceId}`)
        .query({ knodeId });
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { eserviceId: "not-a-uuid", query: { knodeId: "Orion" } },
    { eserviceId: crypto.randomUUID(), query: {} },
    { eserviceId: crypto.randomUUID(), query: { knodeId: "InvalidKnode" } },
  ])(
    "should return 400 if parameters are formatted incorrectly (%o)",
    async ({ eserviceId, query }) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get(`/eservices/${eserviceId}`)
        .query(query as never);

      expect(response.statusCode).toBe(400);
    },
  );
});
