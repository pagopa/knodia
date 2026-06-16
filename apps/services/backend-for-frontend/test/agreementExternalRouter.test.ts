import { AxiosError, type AxiosHeaders, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockJwtVerify = vi.hoisted(() => vi.fn());
const mockDecodeJwt = vi.hoisted(() => vi.fn());
const mockKmsSend = vi.hoisted(() => vi.fn());
const activateAgreementMock = vi.hoisted(() => vi.fn());
const getAgreementMock = vi.hoisted(() => vi.fn());
const getEserviceMock = vi.hoisted(() => vi.fn());
const getOrganizationMock = vi.hoisted(() => vi.fn());
const getRrmOrganizationMock = vi.hoisted(() => vi.fn());

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn().mockReturnValue("mock-jwks"),
  decodeJwt: (...args: unknown[]) => mockDecodeJwt(...args),
  jwtVerify: mockJwtVerify,
}));

vi.mock("@aws-sdk/client-kms", () => ({
  KMSClient: function MockKMSClient() {
    return { send: mockKmsSend };
  },
  SignCommand: function MockSignCommand(
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    return { ...input };
  },
}));

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

vi.mock("@knodia/eservice-process-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/eservice-process-client")>();

  return {
    ...original,
    eserviceProcessApi: {
      ...original.eserviceProcessApi,
      getEservice: getEserviceMock,
    },
  };
});

vi.mock("@knodia/organization-process-client", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@knodia/organization-process-client")
    >();

  return {
    ...original,
    organizationProcessApi: {
      ...original.organizationProcessApi,
      getOrganization: getOrganizationMock,
    },
  };
});

vi.mock("@knodia/remote-resources-manager-client", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@knodia/remote-resources-manager-client")
    >();

  return {
    ...original,
    remoteResourcesManagerApi: {
      ...original.remoteResourcesManagerApi,
      getOrganization: getRrmOrganizationMock,
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
    state: "PendingConsumerOperatorIdentification",
    suspendedByConsumerAt: null,
    suspendedByProducerAt: null,
    updatedAt: "2026-02-01T00:00:00.000Z",
  },
  headers: { "metadata-version": "1" } as unknown as AxiosHeaders,
};

const mockEserviceResponse = {
  data: {
    id: ESERVICE_ID,
    name: { en: "Test E-service" },
  },
  headers: {} as unknown as AxiosHeaders,
};

const mockProducerOrgResponse = {
  data: {
    id: PRODUCER_ID,
    name: "Producer Org",
  },
  headers: {} as unknown as AxiosHeaders,
};

const mockConsumerOrgResponse = {
  data: {
    id: CONSUMER_ID,
    name: "Consumer Org",
  },
  headers: {} as unknown as AxiosHeaders,
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

function makeExternalUISessionPayload(
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

describe("POST /external/agreementActivation/activate (activateAgreement)", () => {
  beforeEach(() => {
    mockJwtVerify.mockResolvedValue({
      payload: makeExternalUISessionPayload(),
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
      url: "/external/agreementActivation/activate",
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
      url: "/external/agreementActivation/activate",
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
      url: "/external/agreementActivation/activate",
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
      url: "/external/agreementActivation/activate",
    });

    expect(response.statusCode).toBe(401);
    expect(activateAgreementMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the scope claim is not a valid ExternalUISessionScope", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: makeExternalUISessionPayload({ scope: "other-scope" }),
      protectedHeader: { alg: "RS256" },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer wrong.scope.token" },
      method: "POST",
      url: "/external/agreementActivation/activate",
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
      url: "/external/agreementActivation/activate",
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
      url: "/external/agreementActivation/activate",
    });

    expect(response.statusCode).toBe(409);
  });
});

describe("GET /external/agreementActivation/details (getAgreementActivationDetails)", () => {
  beforeEach(() => {
    mockJwtVerify.mockResolvedValue({
      payload: makeExternalUISessionPayload(),
      protectedHeader: { alg: "RS256" },
    });
    getAgreementMock.mockResolvedValue(mockAgreementResponse);
    getEserviceMock.mockResolvedValue(mockEserviceResponse);
    getOrganizationMock.mockResolvedValue(mockProducerOrgResponse);
    getRrmOrganizationMock.mockResolvedValue(mockConsumerOrgResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the aggregated details when called with a valid external-ui-session token", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.external.token" },
      method: "GET",
      url: "/external/agreementActivation/details",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      agreement: {
        id: AGREEMENT_ID,
        state: "PendingConsumerOperatorIdentification",
      },
      consumer: {
        id: CONSUMER_ID,
        knodeId: "Orion",
        name: "Consumer Org",
      },
      eservice: {
        id: ESERVICE_ID,
        name: { en: "Test E-service" },
      },
      knodeId: "Orion",
      producer: {
        id: PRODUCER_ID,
        name: "Producer Org",
      },
    });

    expect(getAgreementMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: { agreementId: AGREEMENT_ID } }),
    );
    expect(getEserviceMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: { eserviceId: ESERVICE_ID } }),
    );
    expect(getOrganizationMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: { organizationId: PRODUCER_ID } }),
    );
    expect(getRrmOrganizationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { organizationId: CONSUMER_ID },
        query: { knodeId: "Orion" },
      }),
    );
  });

  it("uses IDs from the agreement record (not the token claims) to drive the downstream resource calls", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: makeExternalUISessionPayload({
        consumer: {
          id: "11111111-1111-4000-8000-111111111111",
          knode_id: "Lynx",
        },
        eservice: {
          id: "22222222-2222-4000-8000-222222222222",
          knode_id: "Lynx",
          version: ESERVICE_VERSION_ID,
        },
        producer: {
          id: "33333333-3333-4000-8000-333333333333",
          knode_id: "Lynx",
        },
      }),
      protectedHeader: { alg: "RS256" },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer tampered.external.token" },
      method: "GET",
      url: "/external/agreementActivation/details",
    });

    expect(response.statusCode).toBe(200);
    expect(getEserviceMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: { eserviceId: ESERVICE_ID } }),
    );
    expect(getOrganizationMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: { organizationId: PRODUCER_ID } }),
    );
    expect(getRrmOrganizationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { organizationId: CONSUMER_ID },
        query: { knodeId: "Orion" },
      }),
    );
    expect(response.json()).toEqual({
      agreement: {
        id: AGREEMENT_ID,
        state: "PendingConsumerOperatorIdentification",
      },
      consumer: {
        id: CONSUMER_ID,
        knodeId: "Orion",
        name: "Consumer Org",
      },
      eservice: {
        id: ESERVICE_ID,
        name: { en: "Test E-service" },
      },
      knodeId: "Orion",
      producer: {
        id: PRODUCER_ID,
        name: "Producer Org",
      },
    });
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
      method: "GET",
      url: "/external/agreementActivation/details",
    });

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 when the scope claim is wrong", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: makeExternalUISessionPayload({ scope: "other-scope" }),
      protectedHeader: { alg: "RS256" },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer wrong.scope.token" },
      method: "GET",
      url: "/external/agreementActivation/details",
    });

    expect(response.statusCode).toBe(401);
  });

  it("passes through a 404 from a downstream service", async () => {
    getEserviceMock.mockRejectedValue(
      makeAxiosError(404, "E-service Not Found"),
    );

    const response = await app.inject({
      headers: { authorization: "Bearer valid.external.token" },
      method: "GET",
      url: "/external/agreementActivation/details",
    });

    expect(response.statusCode).toBe(404);
  });
});
