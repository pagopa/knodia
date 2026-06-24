/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { OutgoingHttpHeaders } from "http2";

import {
  type EserviceId,
  type EserviceVersionId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { randomUUID } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addAsyncCompanyAddressesRequest,
  addAsyncCompanyAddressesResult,
  getAsyncCompanyAddressesRequest,
  getAsyncCompanyAddressesRequestState,
} from "../../src/asyncConsumption/asyncConsumptionRequests.ts";
import {
  ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
  ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
  ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
} from "../../src/asyncConsumption/mockup.ts";
import {
  findLegalEntity,
  findLegalEntityAddress,
} from "../../src/data/legalEntities.ts";
import {
  API_AsyncConsumptionRequestState,
  type API_CompanyUid,
  type API_GetCompanyAddressesResults,
} from "../../src/models/api.ts";
import { getCtx, TEST_KNODE_ID } from "../setup.ts";
import { signEserviceAccessToken } from "../utils.ts";
import { resetAsyncCompanyAddressesMaps } from "./utils.ts";

const OTHER_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const OTHER_MOCK_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "fa2a800a-5058-4859-b68a-bfbd3ee863c0",
);
const BASE_TIME = new Date("2026-01-01T00:00:00.000Z");

// 01229430085 exists but no address is available, 12345678901 exists and has an address, 00000000000 does not exist
const COMPANY_UIDS: API_CompanyUid[] = [
  "01229430085",
  "12345678901",
  "00000000000",
];

function completeRequest(requestId: string): string {
  addAsyncCompanyAddressesRequest(requestId, COMPANY_UIDS);
  vi.setSystemTime(new Date(BASE_TIME.getTime() + 76_000));

  const request = getAsyncCompanyAddressesRequest(requestId);
  const state = getAsyncCompanyAddressesRequestState(request);

  expect(state).toBe(API_AsyncConsumptionRequestState.enum.COMPLETED);

  addAsyncCompanyAddressesResult(request);

  return request.resourceId!;
}

async function getCompanyAddressesResults({
  requestId,
  resourceId,
  token,
}: {
  requestId: string;
  resourceId: string;
  token?: string;
}) {
  const headers: OutgoingHttpHeaders = {};
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  return await getCtx().app.inject({
    headers,
    method: "GET",
    url: `/legal-entities/address-requests/${requestId}/resources/${resourceId}`,
  });
}

async function signToken(
  overrides: {
    eserviceId?: EserviceId;
    eserviceVersionId?: EserviceVersionId;
  } = {},
) {
  return await signEserviceAccessToken({
    eserviceId: overrides.eserviceId ?? ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
    eserviceVersionId:
      overrides.eserviceVersionId ?? ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
    knodeId: TEST_KNODE_ID,
    producerId: ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
    tokenPrivateKey: getCtx().tokenKeys.tokenPrivateKey,
  });
}

beforeEach(() => {
  resetAsyncCompanyAddressesMaps();

  vi.useFakeTimers({
    // Don't fake setTimeout/setInterval — fastify's internal scheduling would
    // hang under fake timers. Only override Date so computePeriodId is
    // deterministic.
    toFake: ["Date"],
  });
  vi.setSystemTime(BASE_TIME);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /legal-entities/address-requests/:requestId/resources/:resourceId (getCompanyAddressesResults)", () => {
  it("returns 200 with results for a completed request", async () => {
    const token = await signToken();
    const requestId = randomUUID();
    const resourceId = completeRequest(requestId);

    const res = await getCompanyAddressesResults({
      requestId,
      resourceId,
      token,
    });

    expect(res.statusCode).toBe(200);

    const body = res.json<API_GetCompanyAddressesResults>();
    const expectedResponse: API_GetCompanyAddressesResults = COMPANY_UIDS.map(
      (uid) => ({
        address: findLegalEntityAddress(uid),
        legalEntity: findLegalEntity(uid),
        uidCompany: uid,
      }),
    );
    expect(body).toEqual(expectedResponse);
  });

  it("returns 404 when the request ID does not exist", async () => {
    const token = await signToken();

    const res = await getCompanyAddressesResults({
      requestId: randomUUID(),
      resourceId: randomUUID(),
      token,
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 404 when the resource ID does not exist", async () => {
    const token = await signToken();
    const requestId = randomUUID();

    addAsyncCompanyAddressesRequest(requestId, COMPANY_UIDS);

    const res = await getCompanyAddressesResults({
      requestId,
      resourceId: randomUUID(),
      token,
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 401 for a token issued for a different mock e-service", async () => {
    const token = await signToken({
      eserviceId: OTHER_MOCK_ESERVICE_ID,
      eserviceVersionId: OTHER_MOCK_ESERVICE_VERSION_ID,
    });
    const requestId = randomUUID();
    const resourceId = completeRequest(requestId);

    const res = await getCompanyAddressesResults({
      requestId,
      resourceId,
      token,
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const requestId = randomUUID();
    const resourceId = completeRequest(requestId);

    const res = await getCompanyAddressesResults({
      requestId,
      resourceId,
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for an invalid UUID format in requestId", async () => {
    const token = await signToken();

    const res = await getCompanyAddressesResults({
      requestId: "not-a-valid-uuid",
      resourceId: randomUUID(),
      token,
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for an invalid UUID format in resourceId", async () => {
    const token = await signToken();
    const requestId = randomUUID();

    addAsyncCompanyAddressesRequest(requestId, COMPANY_UIDS);

    const res = await getCompanyAddressesResults({
      requestId,
      resourceId: "not-a-valid-uuid",
      token,
    });

    expect(res.statusCode).toBe(400);
  });
});
