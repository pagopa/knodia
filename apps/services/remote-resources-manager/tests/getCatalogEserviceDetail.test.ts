/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zocker } from "zocker";

import {
  API_CatalogEserviceDetail,
  type API_CatalogEserviceDetail as API_CatalogEserviceDetailType,
} from "../src/models/api.ts";
import {
  toK2KAccessTokenType,
  toK2KMode,
  toK2KVersionState,
} from "./k2kConverters.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const getEserviceMock = vi.hoisted(() => vi.fn());
const getEserviceLatestVersionMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getEservice: getEserviceMock,
      getEserviceLatestVersion: getEserviceLatestVersionMock,
    },
  };
});

const toK2KEservice = (
  apiDetail: API_CatalogEserviceDetailType,
): k2kGatewayApi.Eservice => ({
  categories: apiDetail.categories,
  description: apiDetail.description,
  id: apiDetail.id,
  isConsumerOperatorIdentificationRequired:
    apiDetail.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: apiDetail.isSignalHubEnabled,
  mode: toK2KMode(apiDetail.mode),
  name: apiDetail.name,
  producerId: apiDetail.producer.id,
  updatedAt: new Date().toISOString(),
});

const toK2KEserviceVersion = (
  apiDetail: API_CatalogEserviceDetailType,
): k2kGatewayApi.EserviceVersion => ({
  accessTokenAudience: apiDetail.latestVersion.accessTokenAudience,
  accessTokenDuration: apiDetail.latestVersion.accessTokenDuration,
  accessTokenType: toK2KAccessTokenType(
    apiDetail.latestVersion.accessTokenType,
  ),
  id: crypto.randomUUID(),
  interfaceDocument: {
    checksum: apiDetail.interfaceDocument.checksum,
    contentType: "application/yaml",
    id: crypto.randomUUID(),
    name: apiDetail.interfaceDocument.name,
    prettyName: apiDetail.interfaceDocument.prettyName,
    updatedAt: new Date().toISOString(),
  },
  maxDailyCallsPerConsumer: apiDetail.latestVersion.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: apiDetail.latestVersion.maxDailyCallsPerKnode,
  requiredAttributes: apiDetail.latestVersion.requiredAttributes,
  state: toK2KVersionState(apiDetail.latestVersion.state),
  updatedAt: new Date().toISOString(),
  versionNumber: 1,
});

describe("GET /eservices/:eserviceId (getCatalogEserviceDetail)", () => {
  const eserviceId = crypto.randomUUID();
  const knodeId = "Orion";

  const expectedApiDetail = zocker(API_CatalogEserviceDetail).generate();
  const k2kEservice = toK2KEservice(expectedApiDetail);
  const k2kVersion = toK2KEserviceVersion(expectedApiDetail);

  beforeEach(() => {
    getEserviceMock.mockReset();
    getEserviceLatestVersionMock.mockReset();
  });

  it("should return 200 with converted detail on success", async () => {
    getEserviceMock.mockResolvedValue({ data: k2kEservice });
    getEserviceLatestVersionMock.mockResolvedValue({ data: k2kVersion });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .get(`/eservices/${eserviceId}`)
      .query({ knodeId });

    expect(response.statusCode).toBe(200);

    const expectedPath = { eserviceId };
    const expectedHeaders = expect.objectContaining({
      [CORRELATION_ID_HEADER]: expect.any(String),
    });

    expect(getEserviceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expectedHeaders,
        path: expectedPath,
      }),
    );
    expect(getEserviceLatestVersionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expectedHeaders,
        path: expectedPath,
      }),
    );

    expect(response.json()).toEqual({
      ...expectedApiDetail,
      producer: {
        email: "info@example.com",
        id: expectedApiDetail.producer.id,
        knodeName: "Knode",
        name: { en: "Producer name" },
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
