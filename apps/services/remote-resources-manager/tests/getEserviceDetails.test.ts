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
const getAgreementMock = vi.hoisted(() => vi.fn());
const getAgreementsByConsumerIdAndEserviceIdMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getAgreement: getAgreementMock,
      getEservice: getEserviceMock,
      getEserviceLatestVersion: getEserviceLatestVersionMock,
      getOrganization: getOrganizationMock,
    },
  };
});

vi.mock("@knodia/db-remote-resource/services", () => ({
  remoteResourceDbServiceBuilder: () => ({
    getAgreementById: vi.fn(),
    getAgreementsByConsumerIdAndEserviceId:
      getAgreementsByConsumerIdAndEserviceIdMock,
    insertAgreement: vi.fn(),
  }),
}));

// eslint-disable-next-line max-lines-per-function
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
    getAgreementMock.mockReset();
    getAgreementsByConsumerIdAndEserviceIdMock.mockReset();
  });

  it("should return 200 with converted detail and no agreement when none exists", async () => {
    getEserviceMock.mockResolvedValue({ data: k2kEservice });
    getEserviceLatestVersionMock.mockResolvedValue({ data: k2kVersion });
    getOrganizationMock.mockResolvedValue({ data: k2kOrganization });
    getAgreementsByConsumerIdAndEserviceIdMock.mockResolvedValue([]);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/eservices/${eserviceId}`)
      .query({ knodeId });

    expect(response.statusCode).toBe(200);

    const expectedPath = { eserviceId };

    expect(getEserviceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expectedPath,
      }),
    );
    expect(getEserviceLatestVersionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expectedPath,
      }),
    );
    expect(getOrganizationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { organizationId: k2kEservice.producerId },
      }),
    );
    expect(getAgreementsByConsumerIdAndEserviceIdMock).toHaveBeenCalledWith(
      TEST_ORGANIZATION_ID,
      eserviceId,
      knodeId,
    );
    expect(getAgreementMock).not.toHaveBeenCalled();

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

  it("should return 200 with agreement when one exists in DB", async () => {
    const agreementId = crypto.randomUUID();
    const k2kAgreement = buildK2KAgreement({
      id: agreementId,
      state: "ACTIVE",
    });

    getEserviceMock.mockResolvedValue({ data: k2kEservice });
    getEserviceLatestVersionMock.mockResolvedValue({ data: k2kVersion });
    getOrganizationMock.mockResolvedValue({ data: k2kOrganization });
    getAgreementsByConsumerIdAndEserviceIdMock.mockResolvedValue([
      {
        agreementId,
        consumerId: TEST_ORGANIZATION_ID,
        eserviceId,
        eserviceVersionId: k2kAgreement.eserviceVersionId,
        knodeId,
        producerId: k2kEservice.producerId,
      },
    ]);
    getAgreementMock.mockResolvedValue({ data: k2kAgreement });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/eservices/${eserviceId}`)
      .query({ knodeId });

    expect(response.statusCode).toBe(200);

    expect(getAgreementMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { agreementId },
      }),
    );

    const body = response.json();
    expect(body.agreement).toEqual({
      id: agreementId,
      state: "Active",
    });
  });

  it("should use first agreement when multiple exist in DB", async () => {
    const agreementId1 = crypto.randomUUID();
    const agreementId2 = crypto.randomUUID();

    const k2kAgreement = buildK2KAgreement({
      id: agreementId1,
      state: "SUSPENDED",
    });

    getEserviceMock.mockResolvedValue({ data: k2kEservice });
    getEserviceLatestVersionMock.mockResolvedValue({ data: k2kVersion });
    getOrganizationMock.mockResolvedValue({ data: k2kOrganization });
    getAgreementsByConsumerIdAndEserviceIdMock.mockResolvedValue([
      {
        agreementId: agreementId1,
        consumerId: TEST_ORGANIZATION_ID,
        eserviceId,
        knodeId,
        producerId: k2kEservice.producerId,
      },
      {
        agreementId: agreementId2,
        consumerId: TEST_ORGANIZATION_ID,
        eserviceId,
        knodeId,
        producerId: k2kEservice.producerId,
      },
    ]);
    getAgreementMock.mockResolvedValue({ data: k2kAgreement });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/eservices/${eserviceId}`)
      .query({ knodeId });

    expect(response.statusCode).toBe(200);

    expect(getAgreementMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { agreementId: agreementId1 },
      }),
    );

    const body = response.json();
    expect(body.agreement).toEqual({
      id: agreementId1,
      state: "Suspended",
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
