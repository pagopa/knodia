import {
  type EserviceId,
  type EserviceVersionId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getAsyncCompanyAddressesRequest,
  getAsyncCompanyAddressesRequestState,
  resetAsyncCompanyAddressesRequests,
} from "../../src/asyncConsumption/asyncConsumptionRequests.ts";
import {
  ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
  ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
  ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
} from "../../src/asyncConsumption/mockup.ts";
import { API_AsyncConsumptionRequestState } from "../../src/models/api.ts";
import { getCtx, TEST_KNODE_ID } from "../setup.ts";
import { signEserviceAccessToken } from "../utils.ts";

const OTHER_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const OTHER_MOCK_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "fa2a800a-5058-4859-b68a-bfbd3ee863c0",
);

const VALID_BODY = ["01229430085", "12345678901"];

async function requestCompanyAddresses({
  body = VALID_BODY,
  token,
}: {
  body?: string[];
  token?: string;
} = {}) {
  return await getCtx().app.inject({
    headers: { authorization: `Bearer ${token}` },
    method: "POST",
    payload: body,
    url: "/legal-entities/address-requests",
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

beforeEach(resetAsyncCompanyAddressesRequests);

describe("POST /legal-entities/address-requests", () => {
  it("returns 200 with a requestId and stores it in memory", async () => {
    const token = await signToken();
    const res = await requestCompanyAddresses({ token });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(getAsyncCompanyAddressesRequest(body.requestId)).toEqual({
      companyUids: VALID_BODY,
      finishDate: expect.any(Date),
      id: body.requestId,
    });
  });

  it("stores every generated requestId in memory", async () => {
    const token = await signToken();

    const firstRequest = await requestCompanyAddresses({ token });
    const secondRequest = await requestCompanyAddresses({ token });

    expect(firstRequest.statusCode).toBe(200);
    expect(secondRequest.statusCode).toBe(200);

    const firstRequestId = firstRequest.json().requestId;
    const secondRequestId = secondRequest.json().requestId;

    expect(firstRequestId).not.toBe(secondRequestId);
    expect(getAsyncCompanyAddressesRequest(firstRequestId)).toEqual({
      companyUids: VALID_BODY,
      finishDate: expect.any(Date),
      id: firstRequestId,
    });
    expect(getAsyncCompanyAddressesRequest(secondRequestId)).toEqual({
      companyUids: VALID_BODY,
      finishDate: expect.any(Date),
      id: secondRequestId,
    });

    expect(getAsyncCompanyAddressesRequestState(firstRequestId)).toEqual(
      API_AsyncConsumptionRequestState.enum.PENDING,
    );
    expect(getAsyncCompanyAddressesRequestState(secondRequestId)).toEqual(
      API_AsyncConsumptionRequestState.enum.PENDING,
    );
  });

  it("returns 400 for a malformed body", async () => {
    const token = await signToken();

    const res = await requestCompanyAddresses({
      body: { invalidBody: "invalid-uid" } as never,
      token,
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 401 for a token issued for a different mock e-service", async () => {
    const token = await signToken({
      eserviceId: OTHER_MOCK_ESERVICE_ID,
      eserviceVersionId: OTHER_MOCK_ESERVICE_VERSION_ID,
    });

    const res = await requestCompanyAddresses({ token });

    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const res = await requestCompanyAddresses();

    expect(res.statusCode).toBe(401);
  });
});
