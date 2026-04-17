import { generateId } from "@knodia/common-models/ids";
import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAgreementMock = vi.hoisted(() => vi.fn());
const generateExternalUISessionMagicLinkTokenMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/token-generator/refreshable", () => ({
  refreshableInternalTokenGenerator: () => ({
    get: vi.fn().mockResolvedValue({
      serialized: "mock-internal-token",
    }),
  }),
}));

vi.mock("@knodia/token-generator", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/token-generator")>();

  return {
    ...original,
    tokenGeneratorBuilder: () => ({
      generateExternalUISessionMagicLinkToken:
        generateExternalUISessionMagicLinkTokenMock,
    }),
  };
});

vi.mock("@knodia/agreement-process-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/agreement-process-client")>();

  return {
    ...original,
    agreementProcessApi: {
      ...original.agreementProcessApi,
      getAgreement: getAgreementMock,
    },
  };
});

// Must import after vi.mock
import { injectRequest } from "../utils.ts";

function makeAxios404(title: string): AxiosError {
  const error = new AxiosError("Request failed with status code 404");
  error.response = {
    data: {
      correlationId: generateId(),
      errors: [{ code: "000-0000", detail: title }],
      status: 404,
      title,
    },
    headers: {},
    status: 404,
  } as AxiosResponse;
  return error;
}

const agreementId = generateId();
const consumerId = generateId();
const eserviceId = generateId();
const eserviceVersionId = generateId();
const producerId = generateId();

const mockAgreement = {
  data: {
    attributes: [],
    consumer: { id: consumerId, knodeId: "Orion" },
    eserviceId,
    eserviceVersionId,
    id: agreementId,
    producerId,
    state: "PendingConsumerOperatorIdentification",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
};

const mockTokenExpiresAt = 1_800_000_000; // arbitrary far-future unix seconds
const mockToken = {
  header: "mock-header",
  payload: {
    agreementId,
    aud: "test-magic-link-audience",
    consumerId,
    consumerKnodeId: "Orion",
    eserviceId,
    eserviceVersionId,
    exp: mockTokenExpiresAt,
    iat: mockTokenExpiresAt - 120,
    iss: "test-magic-link-issuer",
    jti: generateId(),
    producerId,
    scope: "agreement-activation",
    sub: agreementId,
    type: "external-ui-session-magic-link",
  },
  serialized: "mock.magic-link.token",
  type: "external-ui-session-magic-link",
};

beforeEach(() => {
  getAgreementMock.mockReset();
  generateExternalUISessionMagicLinkTokenMock.mockReset();
});

describe("POST /agreements/:agreementId/activationMagicLink (createAgreementActivationMagicLink)", () => {
  const makeRequest = (id: string = agreementId) =>
    injectRequest().post(`/agreements/${id}/activationMagicLink`);

  it("returns 200 with a signed URL and expiresAt when the agreement exists", async () => {
    getAgreementMock.mockResolvedValue(mockAgreement);
    generateExternalUISessionMagicLinkTokenMock.mockResolvedValue(mockToken);

    const response = await makeRequest();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      expiresAt: new Date(mockTokenExpiresAt * 1000).toISOString(),
      url: `https://test-frontend.example/activate?token=${encodeURIComponent(mockToken.serialized)}`,
    });
  });

  it("mints a token with claims derived from the agreement", async () => {
    getAgreementMock.mockResolvedValue(mockAgreement);
    generateExternalUISessionMagicLinkTokenMock.mockResolvedValue(mockToken);

    await makeRequest();

    expect(generateExternalUISessionMagicLinkTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        agreementId,
        audience: "test-magic-link-audience",
        consumerId,
        consumerKnodeId: "Orion",
        eserviceId,
        eserviceVersionId,
        issuer: "test-magic-link-issuer",
        kid: "test-magic-link-kid",
        producerId,
        scope: "agreement-activation",
        secondsDuration: 120,
        subject: agreementId,
      }),
    );
  });

  it("passes agreement retrieval through to agreement-process with the agreementId", async () => {
    getAgreementMock.mockResolvedValue(mockAgreement);
    generateExternalUISessionMagicLinkTokenMock.mockResolvedValue(mockToken);

    await makeRequest();

    expect(getAgreementMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: { agreementId } }),
    );
  });

  it("passes through a 404 when the agreement does not exist", async () => {
    getAgreementMock.mockRejectedValue(makeAxios404("Agreement Not Found"));

    const response = await makeRequest();

    expect(response.statusCode).toBe(404);
    expect(generateExternalUISessionMagicLinkTokenMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the agreementId path param is not a UUID", async () => {
    const response = await makeRequest("not-a-uuid");

    expect(response.statusCode).toBe(400);
    expect(getAgreementMock).not.toHaveBeenCalled();
    expect(generateExternalUISessionMagicLinkTokenMock).not.toHaveBeenCalled();
  });
});
