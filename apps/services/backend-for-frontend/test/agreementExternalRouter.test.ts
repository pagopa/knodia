import { AxiosError, type AxiosHeaders, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { joseMockFactory, kmsMockFactory } from "./mocks/authMocks.ts";

const { mockDecodeJwt, mockJwtVerify, mockKmsSend } = vi.hoisted(() => ({
  mockDecodeJwt: vi.fn<(...args: unknown[]) => unknown>(),
  mockJwtVerify: vi.fn<(...args: unknown[]) => unknown>(),
  mockKmsSend: vi.fn<(...args: unknown[]) => unknown>(),
}));
const activateAgreementMock = vi.hoisted(() => vi.fn());
const getAgreementMock = vi.hoisted(() => vi.fn());

vi.mock("jose", () => joseMockFactory({ mockDecodeJwt, mockJwtVerify }));
vi.mock("@aws-sdk/client-kms", () => kmsMockFactory({ mockKmsSend }));

vi.mock("@knodia/agreement-process-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/agreement-process-client")>();

  return {
    ...original,
    agreementProcessApi: {
      ...original.agreementProcessApi,
      activateAgreement: activateAgreementMock,
      getAgreement: getAgreementMock,
    },
  };
});

import { app } from "./setup.ts";

const AGREEMENT_ID = "40000000-4000-1000-8000-000000000004";
const CONSUMER_ID = "50000000-5000-1000-8000-000000000005";
const ESERVICE_ID = "60000000-6000-1000-8000-000000000006";
const ESERVICE_VERSION_ID = "70000000-7000-1000-8000-000000000007";
const PRODUCER_ID = "80000000-8000-1000-8000-000000000008";

const mockAgreementResponse = {
  data: {
    attributes: [],
    consumer: { id: CONSUMER_ID, knodeId: "Orion" },
    createdAt: "2026-01-01T00:00:00.000Z",
    eserviceId: ESERVICE_ID,
    eserviceVersionId: ESERVICE_VERSION_ID,
    id: AGREEMENT_ID,
    producerId: PRODUCER_ID,
    state: "Active",
    suspendedByConsumerAt: null,
    suspendedByProducerAt: null,
    updatedAt: "2026-02-01T00:00:00.000Z",
  },
  headers: { "metadata-version": "1" } as unknown as AxiosHeaders,
};

function makeAxiosError(status: number, title: string): AxiosError {
  const error = new AxiosError(`Request failed with status code ${status}`);
  error.response = {
    data: {
      correlationId: crypto.randomUUID(),
      errors: [{ code: "000-0000", detail: title }],
      status,
      title,
    },
    headers: {},
    status,
  } as AxiosResponse;
  return error;
}

function makeExternalUiSessionPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    agreement: { id: AGREEMENT_ID, knode_id: "Lynx" },
    aud: "test-external-ui-session-audience",
    consumer: { id: CONSUMER_ID, knode_id: "Orion" },
    eservice: {
      id: ESERVICE_ID,
      knode_id: "Lynx",
      version: ESERVICE_VERSION_ID,
    },
    exp: Math.floor(Date.now() / 1000) + 300,
    iat: Math.floor(Date.now() / 1000),
    iss: "test-issuer",
    jti: crypto.randomUUID(),
    producer: { id: PRODUCER_ID, knode_id: "Lynx" },
    scope: "agreement-activation",
    sub: AGREEMENT_ID,
    type: "external-ui-session",
    ...overrides,
  };
}

describe("POST /external/agreements/:agreementId/activate (activateAgreement)", () => {
  beforeEach(() => {
    mockJwtVerify.mockResolvedValue({
      payload: makeExternalUiSessionPayload(),
      protectedHeader: { alg: "RS256" },
    });
    activateAgreementMock.mockResolvedValue(mockAgreementResponse);
    getAgreementMock.mockResolvedValue(mockAgreementResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 204 and polls the readmodel when called with a valid external-ui-session token", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.external.token" },
      method: "POST",
      url: `/external/agreements/${AGREEMENT_ID}/activate`,
    });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
    expect(activateAgreementMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { agreementId: AGREEMENT_ID },
      }),
    );
    expect(getAgreementMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { agreementId: AGREEMENT_ID },
      }),
    );
  });

  it("forwards the caller's Authorization header to agreement-process", async () => {
    await app.inject({
      headers: { authorization: "Bearer my.external.token" },
      method: "POST",
      url: `/external/agreements/${AGREEMENT_ID}/activate`,
    });

    const call = activateAgreementMock.mock.calls[0]?.[0] as {
      headers: Record<string, string>;
    };
    expect(call.headers["authorization"]).toBe("Bearer my.external.token");
  });

  it("returns 401 for an internal token", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: {
        aud: "test-audience",
        exp: Math.floor(Date.now() / 1000) + 300,
        iat: Math.floor(Date.now() / 1000),
        iss: "test-issuer",
        jti: crypto.randomUUID(),
        sub: "internal-caller",
        type: "internal",
      },
      protectedHeader: { alg: "RS256" },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer internal.token" },
      method: "POST",
      url: `/external/agreements/${AGREEMENT_ID}/activate`,
    });

    expect(response.statusCode).toBe(401);
    expect(activateAgreementMock).not.toHaveBeenCalled();
  });

  it("returns 401 for a ui-session token", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: {
        aud: "test-audience",
        exp: Math.floor(Date.now() / 1000) + 300,
        iat: Math.floor(Date.now() / 1000),
        iss: "test-issuer",
        jti: crypto.randomUUID(),
        organizationId: CONSUMER_ID,
        roles: ["administrative"],
        sub: "10000000-1000-1000-8000-000000000001",
        type: "ui-session",
        username: "test-user",
      },
      protectedHeader: { alg: "RS256" },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer ui-session.token" },
      method: "POST",
      url: `/external/agreements/${AGREEMENT_ID}/activate`,
    });

    expect(response.statusCode).toBe(401);
    expect(activateAgreementMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the scope claim is not a valid ExternalUISessionScope", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: makeExternalUiSessionPayload({ scope: "other-scope" }),
      protectedHeader: { alg: "RS256" },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer wrong.scope.token" },
      method: "POST",
      url: `/external/agreements/${AGREEMENT_ID}/activate`,
    });

    expect(response.statusCode).toBe(401);
    expect(activateAgreementMock).not.toHaveBeenCalled();
  });

  it("passes through a 404 from agreement-process", async () => {
    activateAgreementMock.mockRejectedValue(
      makeAxiosError(404, "Agreement Not Found"),
    );

    const response = await app.inject({
      headers: { authorization: "Bearer valid.external.token" },
      method: "POST",
      url: `/external/agreements/${AGREEMENT_ID}/activate`,
    });

    expect(response.statusCode).toBe(404);
  });

  it("passes through a 409 from agreement-process (wrong state)", async () => {
    activateAgreementMock.mockRejectedValue(
      makeAxiosError(409, "Agreement Not In Expected State"),
    );

    const response = await app.inject({
      headers: { authorization: "Bearer valid.external.token" },
      method: "POST",
      url: `/external/agreements/${AGREEMENT_ID}/activate`,
    });

    expect(response.statusCode).toBe(409);
  });

  it("returns 400 when agreementId path param is not a UUID", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.external.token" },
      method: "POST",
      url: `/external/agreements/not-a-uuid/activate`,
    });

    expect(response.statusCode).toBe(400);
    expect(activateAgreementMock).not.toHaveBeenCalled();
  });
});
