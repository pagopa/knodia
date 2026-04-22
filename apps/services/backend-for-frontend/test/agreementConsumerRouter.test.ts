import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockJwtVerify = vi.hoisted(() => vi.fn());
const mockDecodeJwt = vi.hoisted(() => vi.fn());
const mockKmsSend = vi.hoisted(() => vi.fn());
const createAgreementActivationMagicLinkMock = vi.hoisted(() => vi.fn());

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

vi.mock("@knodia/remote-resources-manager-client", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@knodia/remote-resources-manager-client")
    >();

  return {
    ...original,
    remoteResourcesManagerApi: {
      ...original.remoteResourcesManagerApi,
      createAgreementActivationMagicLink:
        createAgreementActivationMagicLinkMock,
    },
  };
});

import { app } from "./setup.ts";

const AGREEMENT_ID = "40000000-4000-1000-8000-000000000004";
const CONSUMER_ID = "50000000-5000-1000-8000-000000000005";
const USER_ID = "10000000-1000-1000-8000-000000000001";

const mockMagicLinkResponse = {
  data: {
    expiresAt: "2026-06-01T00:00:00.000Z",
    url: "https://producer.example/activate#token=abc.def.ghi",
  },
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

function makeUiSessionPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    aud: "test-audience",
    exp: Math.floor(Date.now() / 1000) + 300,
    iat: Math.floor(Date.now() / 1000),
    iss: "test-issuer",
    jti: crypto.randomUUID(),
    organizationId: CONSUMER_ID,
    roles: ["administrative"],
    sub: USER_ID,
    type: "ui-session",
    username: "test-user",
    ...overrides,
  };
}

describe("POST /consumer/agreements/:agreementId/activationMagicLink (createConsumerAgreementActivationMagicLink)", () => {
  beforeEach(() => {
    mockJwtVerify.mockResolvedValue({
      payload: makeUiSessionPayload(),
      protectedHeader: { alg: "RS256" },
    });
    createAgreementActivationMagicLinkMock.mockResolvedValue(
      mockMagicLinkResponse,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with the magic link forwarded from RRM on the happy path", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "POST",
      query: { knodeId: "Lynx" },
      url: `/consumer/agreements/${AGREEMENT_ID}/activationMagicLink`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(mockMagicLinkResponse.data);
    expect(createAgreementActivationMagicLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { agreementId: AGREEMENT_ID },
        query: { knodeId: "Lynx" },
      }),
    );
  });

  it("returns 401 for a non-ui-session token (e.g. external-ui-session)", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: {
        agreementId: AGREEMENT_ID,
        aud: "test-external-ui-session-audience",
        consumerId: CONSUMER_ID,
        consumerKnodeId: "Orion",
        eserviceId: "60000000-6000-1000-8000-000000000006",
        eserviceVersionId: "70000000-7000-1000-8000-000000000007",
        exp: Math.floor(Date.now() / 1000) + 300,
        iat: Math.floor(Date.now() / 1000),
        iss: "test-issuer",
        jti: crypto.randomUUID(),
        producerId: "80000000-8000-1000-8000-000000000008",
        scope: "agreement-activation",
        sub: AGREEMENT_ID,
        type: "external-ui-session",
      },
      protectedHeader: { alg: "RS256" },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer external.ui.session" },
      method: "POST",
      query: { knodeId: "Lynx" },
      url: `/consumer/agreements/${AGREEMENT_ID}/activationMagicLink`,
    });

    expect(response.statusCode).toBe(401);
    expect(createAgreementActivationMagicLinkMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the query is missing knodeId", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "POST",
      url: `/consumer/agreements/${AGREEMENT_ID}/activationMagicLink`,
    });

    expect(response.statusCode).toBe(400);
    expect(createAgreementActivationMagicLinkMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the agreementId path param is not a UUID", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "POST",
      query: { knodeId: "Lynx" },
      url: "/consumer/agreements/not-a-uuid/activationMagicLink",
    });

    expect(response.statusCode).toBe(400);
    expect(createAgreementActivationMagicLinkMock).not.toHaveBeenCalled();
  });

  it("passes through a 404 from RRM (agreement not found)", async () => {
    createAgreementActivationMagicLinkMock.mockRejectedValue(
      makeAxiosError(404, "Agreement Not Found"),
    );

    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "POST",
      query: { knodeId: "Lynx" },
      url: `/consumer/agreements/${AGREEMENT_ID}/activationMagicLink`,
    });

    expect(response.statusCode).toBe(404);
  });

  it("passes through a 403 from RRM (organization is not the agreement consumer)", async () => {
    createAgreementActivationMagicLinkMock.mockRejectedValue(
      makeAxiosError(403, "Organization is not the Agreement consumer"),
    );

    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "POST",
      query: { knodeId: "Lynx" },
      url: `/consumer/agreements/${AGREEMENT_ID}/activationMagicLink`,
    });

    expect(response.statusCode).toBe(403);
  });
});
