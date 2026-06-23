import type { UUID } from "crypto";

import {
  type EserviceId,
  type EserviceVersionId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addAsyncCompanyAddressesRequest,
  resetAsyncCompanyAddressesRequests,
} from "../../src/asyncConsumption/asyncConsumptionRequests.ts";
import {
  ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
  ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
  ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
} from "../../src/asyncConsumption/mockup.ts";
import {
  API_AsyncConsumptionRequestStatus,
  type API_GetCompanyAddressesRequestStatusResponse,
} from "../../src/models/api.ts";
import { getCtx, TEST_KNODE_ID } from "../setup.ts";
import { signEserviceAccessToken } from "../utils.ts";

const OTHER_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const OTHER_MOCK_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "fa2a800a-5058-4859-b68a-bfbd3ee863c0",
);
const BASE_TIME = new Date("2026-01-01T00:00:00.000Z");

async function getCompanyAddressesRequestStatus({
  requestId,
  token,
}: {
  requestId: UUID;
  token?: string;
}) {
  return await getCtx().app.inject({
    headers: { authorization: `Bearer ${token}` },
    method: "GET",
    url: `/legal-entities/address-requests/${requestId}`,
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
  resetAsyncCompanyAddressesRequests();

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

describe("GET /legal-entities/address-requests/:requestId", () => {
  it("returns 200 with status PENDING for a newly created request", async () => {
    const token = await signToken();
    const requestId = crypto.randomUUID();

    addAsyncCompanyAddressesRequest(requestId);

    const res = await getCompanyAddressesRequestStatus({
      requestId,
      token,
    });

    expect(res.statusCode).toBe(200);

    const body = res.json<API_GetCompanyAddressesRequestStatusResponse>();
    const expectedResponse: API_GetCompanyAddressesRequestStatusResponse = {
      resourceId: undefined,
      status: API_AsyncConsumptionRequestStatus.enum.PENDING,
    };
    expect(body).toEqual(expectedResponse);
  });

  it("returns 200 with status COMPLETED and a resourceId after the finish date", async () => {
    const token = await signToken();
    const requestId = crypto.randomUUID();

    addAsyncCompanyAddressesRequest(requestId);
    vi.setSystemTime(new Date(BASE_TIME.getTime() + 76_000));

    const res = await getCompanyAddressesRequestStatus({
      requestId,
      token,
    });

    expect(res.statusCode).toBe(200);

    const body = res.json<API_GetCompanyAddressesRequestStatusResponse>();
    const expectedResponse: API_GetCompanyAddressesRequestStatusResponse = {
      resourceId: expect.any(String),
      status: API_AsyncConsumptionRequestStatus.enum.COMPLETED,
    };
    expect(body).toEqual(expectedResponse);
  });

  it("returns 200 with status PENDING before the finish date", async () => {
    const token = await signToken();
    const requestId = crypto.randomUUID();

    addAsyncCompanyAddressesRequest(requestId);
    vi.setSystemTime(new Date(BASE_TIME.getTime() + 59_000));

    const res = await getCompanyAddressesRequestStatus({
      requestId,
      token,
    });

    expect(res.statusCode).toBe(200);

    const body = res.json<API_GetCompanyAddressesRequestStatusResponse>();
    const expectedResponse: API_GetCompanyAddressesRequestStatusResponse = {
      resourceId: undefined,
      status: API_AsyncConsumptionRequestStatus.enum.PENDING,
    };
    expect(body).toEqual(expectedResponse);
  });

  it("returns 404 when the request ID does not exist", async () => {
    const token = await signToken();
    const nonExistentRequestId = crypto.randomUUID();

    const res = await getCompanyAddressesRequestStatus({
      requestId: nonExistentRequestId,
      token,
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 401 for a token issued for a different mock e-service", async () => {
    const token = await signToken({
      eserviceId: OTHER_MOCK_ESERVICE_ID,
      eserviceVersionId: OTHER_MOCK_ESERVICE_VERSION_ID,
    });
    const requestId = crypto.randomUUID();

    addAsyncCompanyAddressesRequest(requestId);

    const res = await getCompanyAddressesRequestStatus({
      requestId,
      token,
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const requestId = crypto.randomUUID();

    addAsyncCompanyAddressesRequest(requestId);

    const res = await getCompanyAddressesRequestStatus({
      requestId,
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for an invalid UUID format in requestId", async () => {
    const token = await signToken();

    const res = await getCompanyAddressesRequestStatus({
      requestId: "not-a-valid-uuid" as never,
      token,
    });

    expect(res.statusCode).toBe(400);
  });
});
