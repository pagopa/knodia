/* eslint-disable max-lines-per-function */
/* eslint-disable vitest/no-conditional-expect */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { Agreement, AgreementState } from "@knodia/agreement-models";
import type { KnodeId } from "@knodia/common-models/ids";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { API_AgreementState } from "@knodia/agreement-models/api";
import { type RemoteResourceAgreementSQL } from "@knodia/db-remote-resource";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockAgreement,
  getMockEservice,
  getMockOrganization,
} from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { API_Eservice } from "../src/models/eservice/api.ts";

import { toK2KAPI_AgreementState } from "../src/models/agreement/apiConverter.ts";
import { toAPI_Eservice } from "../src/models/eservice/apiConverter.ts";
import {
  toK2KAgreement,
  toK2KEservice,
  toK2KEserviceVersion,
  toK2KOrganization,
} from "./k2kConverters.ts";
import { remoteResourceDbService } from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

const getAgreementsMock = vi.hoisted(() => vi.fn());
const getEservicesMock = vi.hoisted(() => vi.fn());
const getEserviceVersionMock = vi.hoisted(() => vi.fn());
const getOrganizationsMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getAgreements: getAgreementsMock,
      getEserviceLatestVersion: getEserviceVersionMock,
      getEservices: getEservicesMock,
      getOrganizations: getOrganizationsMock,
    },
  };
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

describe("GET /eservices (getEservices)", () => {
  const defaultQuery = {
    limit: "10",
    offset: "0",
  };
  const parsedDefaultQuery = {
    limit: 10,
    offset: 0,
  };

  const knodeId: KnodeId = "Orion";

  function createMocks(
    state: AgreementState,
    seed: number,
  ): {
    agreement: Agreement;
    expectedApiResult: API_Eservice;
    k2kAgreement: k2kGatewayApi.Agreement;
    k2kEservices: k2kGatewayApi.Eservices;
    k2kEserviceVersion: k2kGatewayApi.EserviceVersion;
    k2kOrganizations: k2kGatewayApi.Organizations;
    remoteAgreement: RemoteResourceAgreementSQL;
  } {
    const eservice = getMockEservice({ latestVersionState: "Active", seed });
    const eserviceVersion = eservice.versions[0]!;
    const k2kEservice = toK2KEservice(eservice);
    const k2kEservices: k2kGatewayApi.Eservices = {
      pagination: { limit: 1, offset: 0, total: 1 },
      results: [k2kEservice],
    };
    const k2kEserviceVersion = toK2KEserviceVersion(eserviceVersion);

    const organization = getMockOrganization();
    const k2kOrganization = toK2KOrganization(organization);
    const k2kOrganizations: k2kGatewayApi.Organizations = {
      pagination: { limit: 1, offset: 0, total: 1 },
      results: [k2kOrganization],
    };

    const agreement = {
      ...getMockAgreement({ seed, state }),
      eserviceId: eservice.id,
      eserviceVersionId: eserviceVersion.id,
      producerId: organization.id,
    };
    const k2kAgreement = toK2KAgreement(agreement);

    const expectedApiResult = toAPI_Eservice({
      agreement: k2kAgreement,
      eservice: k2kEservice,
      eserviceVersion: k2kEserviceVersion,
      producer: {
        ...k2kOrganization,
        knodeId,
      },
    });

    const remoteAgreement: RemoteResourceAgreementSQL = {
      agreementId: agreement.id,
      consumerId: TEST_ORGANIZATION_ID,
      eserviceId: agreement.eserviceId,
      eserviceVersionId: agreement.eserviceVersionId,
      knodeId,
      producerId: agreement.producerId,
    };

    return {
      agreement,
      expectedApiResult,
      k2kAgreement,
      k2kEservices,
      k2kEserviceVersion,
      k2kOrganizations,
      remoteAgreement,
    };
  }

  const agreementStates = [...API_AgreementState.options] as const;
  const testCases = agreementStates.map((agreementState, seed) =>
    createMocks(agreementState, seed),
  );

  beforeEach(() => {
    getAgreementsMock.mockReset();
    getEservicesMock.mockReset();
    getEserviceVersionMock.mockReset();
    getOrganizationsMock.mockReset();
  });

  const agreementStateQueryParams = [...agreementStates, undefined] as const;
  it.each(agreementStateQueryParams)(
    "should return 200 with converted results on success (agreementState=%s)",
    async (agreementState) => {
      const {
        agreement,
        expectedApiResult,
        k2kAgreement,
        k2kEservices,
        k2kEserviceVersion,
        k2kOrganizations,
        remoteAgreement,
      } =
        agreementState === undefined
          ? testCases[Math.floor(Math.random() * testCases.length)]!
          : testCases.find((tc) => tc.agreement.state === agreementState)!;

      await remoteResourceDbService.insertAgreement(remoteAgreement);

      getAgreementsMock.mockResolvedValue({
        data: {
          pagination: { ...parsedDefaultQuery, total: 1 },
          results: [k2kAgreement],
        },
      });
      getEservicesMock.mockResolvedValue({
        data: k2kEservices,
      });
      getEserviceVersionMock.mockResolvedValue({
        data: k2kEserviceVersion,
      });
      getOrganizationsMock.mockResolvedValue({
        data: k2kOrganizations,
      });

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/eservices")
        .query({
          ...defaultQuery,
          ...(agreementState ? { agreementState } : {}),
        });

      expect(response.statusCode).toBe(200);

      expect(getAgreementsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            ...parsedDefaultQuery,
            ...(agreementState
              ? { state: toK2KAPI_AgreementState(agreementState) }
              : {}),
            consumerId: TEST_ORGANIZATION_ID,
          },
        }),
      );

      if (!agreementState) {
        expect(getEservicesMock).toHaveBeenCalledWith(
          expect.objectContaining({
            query: {
              eserviceId: k2kEservices.results.map((e) => e.id),
              limit: k2kEservices.pagination.limit,
              offset: k2kEservices.pagination.offset,
            },
          }),
        );
        expect(getEserviceVersionMock).toHaveBeenCalledWith(
          expect.objectContaining({
            path: {
              eserviceId: agreement.eserviceId,
            },
          }),
        );
        expect(getOrganizationsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            query: {
              limit: k2kOrganizations.pagination.limit,
              offset: k2kOrganizations.pagination.offset,
              organizationId: k2kOrganizations.results.map((org) => org.id),
            },
          }),
        );
      }

      expect(response.json()).toEqual({
        pagination: {
          ...parsedDefaultQuery,
          total: 1,
        },
        results: [expectedApiResult],
      });
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .get("/eservices")
        .query(defaultQuery);
      expect(response.statusCode).toBe(403);
    },
  );

  it.each([
    { limit: "abc", offset: "0" },
    { limit: "0", offset: "0" },
    { limit: "51", offset: "0" },
    { limit: "10", offset: "-1" },
    { limit: new Date(), offset: NaN },
    { limit: 9999999, offset: 9999999 },
    { ...defaultQuery, agreementState: "InvalidState" },
    {
      ...defaultQuery,
      invalidParam: "invalid",
    },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .get("/eservices")
        .query(query as never);

      expect(response.statusCode).toBe(400);
    },
  );
});
