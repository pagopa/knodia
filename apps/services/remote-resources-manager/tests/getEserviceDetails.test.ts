/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zocker } from "zocker";

import { API_EserviceDetails } from "../src/models/eservice/api.ts";
import { toK2KEservice, toK2KEserviceVersion } from "./k2kConverters.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const getEserviceMock = vi.hoisted(() => vi.fn());
const getEserviceLatestVersionMock = vi.hoisted(() => vi.fn());
const getOrganizationMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getEservice: getEserviceMock,
      getEserviceLatestVersion: getEserviceLatestVersionMock,
      getOrganization: getOrganizationMock,
    },
  };
});

describe("GET /eservices/:eserviceId (getEserviceDetails)", () => {
  const eserviceId = crypto.randomUUID();
  const knodeId = "Orion";

  const expectedApiDetail = zocker(API_EserviceDetails).generate();
  const k2kEservice = toK2KEservice(expectedApiDetail);
  const k2kVersion = toK2KEserviceVersion(expectedApiDetail);
  const k2kOrganization: k2kGatewayApi.Organization = {
    attributes: [],
    id: k2kEservice.producerId,
    name: expectedApiDetail.producer.name,
  };

  beforeEach(() => {
    getEserviceMock.mockReset();
    getEserviceLatestVersionMock.mockReset();
    getOrganizationMock.mockReset();
  });

  it("should return 200 with converted detail on success", async () => {
    getEserviceMock.mockResolvedValue({ data: k2kEservice });
    getEserviceLatestVersionMock.mockResolvedValue({ data: k2kVersion });
    getOrganizationMock.mockResolvedValue({ data: k2kOrganization });

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
