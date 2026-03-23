/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockEservice,
  getMockOrganization,
} from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toAPI_EserviceDetails } from "../src/models/eservice/apiConverter.ts";
import {
  toK2KEservice,
  toK2KEserviceVersion,
  toK2KOrganization,
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

describe("GET /eservices/:eserviceId (getEserviceDetails)", () => {
  const eserviceId = crypto.randomUUID();
  const knodeId = "Orion";

  const eservice = getMockEservice({ latestVersionState: "Active" });
  const eserviceVersion = eservice.versions[0]!;
  const k2kEservice = toK2KEservice(eservice);
  const k2kVersion = toK2KEserviceVersion(eserviceVersion);

  const organization = getMockOrganization();
  const k2kOrganization = toK2KOrganization(organization);

  const expectedApiDetail = toAPI_EserviceDetails(
    k2kEservice,
    k2kVersion,
    k2kOrganization,
  );

  const emptyAgreementsResponse = {
    pagination: { limit: 1, offset: 0, total: 0 },
    results: [],
  };

  beforeEach(() => {
    getEserviceMock.mockReset();
    getEserviceLatestVersionMock.mockReset();
    getOrganizationMock.mockReset();
    getAgreementsMock.mockReset();
  });

  it("should return 200 with converted detail on success", async () => {
    getEserviceMock.mockResolvedValue({ data: k2kEservice });
    getEserviceLatestVersionMock.mockResolvedValue({ data: k2kVersion });
    getOrganizationMock.mockResolvedValue({ data: k2kOrganization });
    getAgreementsMock.mockResolvedValue({ data: emptyAgreementsResponse });

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

    expect(response.json()).toEqual({
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
