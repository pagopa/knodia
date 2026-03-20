/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { TEST_ORGANIZATION_ID } from "@knodia/test-commons/auth";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zocker } from "zocker";

import { API_EserviceDetails } from "../src/models/eservice/api.ts";
import {
  toK2KEservice,
  toK2KEserviceVersion,
  toK2KKnodeId,
} from "./k2kConverters.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
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

vi.mock("@knodia/db-remote-resource/services", () => ({
  remoteResourceDbServiceBuilder: () => ({
    getAgreementById: vi.fn(),
    insertAgreement: vi.fn(),
  }),
}));

describe("GET /eservices/:eserviceId (getEserviceDetails)", () => {
  const eserviceId = crypto.randomUUID();
  const knodeId: API_KnodeId = "Orion";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { agreement, ...expectedApiDetail } =
    zocker(API_EserviceDetails).generate();
  const k2kEservice = toK2KEservice(expectedApiDetail);
  const k2kVersion = toK2KEserviceVersion(expectedApiDetail);
  const k2kOrganization: k2kGatewayApi.Organization = {
    attributes: [],
    id: k2kEservice.producerId,
    name: expectedApiDetail.producer.name,
  };

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
      expect.objectContaining({ path: { eserviceId } }),
    );
    expect(getEserviceLatestVersionMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: { eserviceId } }),
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
        knodeName: "Knode",
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
