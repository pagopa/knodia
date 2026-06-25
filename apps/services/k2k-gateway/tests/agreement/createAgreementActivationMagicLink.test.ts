import { generateId } from "@knodia/common-models/ids";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAgreementActivationClaimsMock = vi.hoisted(() => vi.fn());
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
      getAgreementActivationClaims: getAgreementActivationClaimsMock,
    },
  };
});

import { makeAxiosError } from "@knodia/test-commons/utils";

// Must import after vi.mock
import { injectRequest } from "../utils.ts";

const agreementId = generateId();
const consumerId = generateId();
const eserviceId = generateId();
const eserviceVersionId = generateId();
const producerId = generateId();

const mockClaimsResponse = {
  data: {
    agreement: { id: agreementId, knodeId: "Orion" },
    consumer: { id: consumerId, knodeId: "Lynx" },
    eservice: {
      id: eserviceId,
      knodeId: "Orion",
      version: eserviceVersionId,
    },
    producer: { id: producerId, knodeId: "Orion" },
  },
};

const mockTokenExpiresAt = 1_800_000_000; // arbitrary far-future unix seconds
const mockToken = {
  header: "mock-header",
  payload: {
    agreement: { id: agreementId, knode_id: "Orion" },
    aud: "test-magic-link-audience",
    consumer: { id: consumerId, knode_id: "Lynx" },
    eservice: {
      id: eserviceId,
      knode_id: "Orion",
      version: eserviceVersionId,
    },
    exp: mockTokenExpiresAt,
    iat: mockTokenExpiresAt - 120,
    iss: "test-magic-link-issuer",
    jti: generateId(),
    producer: { id: producerId, knode_id: "Orion" },
    scope: "agreement-activation",
    sub: agreementId,
    type: "external-ui-session-magic-link",
  },
  serialized: "mock.magic-link.token",
  type: "external-ui-session-magic-link",
};

beforeEach(() => {
  getAgreementActivationClaimsMock.mockReset();
  generateExternalUISessionMagicLinkTokenMock.mockReset();
});

describe("POST /agreements/:agreementId/activationMagicLink (createAgreementActivationMagicLink)", () => {
  const makeRequest = (id: string = agreementId) =>
    injectRequest().post(`/agreements/${id}/activationMagicLink`);

  it("returns 200 with a signed URL and expiresAt for a pending agreement", async () => {
    getAgreementActivationClaimsMock.mockResolvedValue(mockClaimsResponse);
    generateExternalUISessionMagicLinkTokenMock.mockResolvedValue(mockToken);

    const response = await makeRequest();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      expiresAt: new Date(mockTokenExpiresAt * 1000).toISOString(),
      url: `https://test-frontend.example/ui/agreement-activation#token=${encodeURIComponent(mockToken.serialized)}`,
    });
  });

  it("mints a token with claims sourced from agreement-process's activation-claims endpoint", async () => {
    getAgreementActivationClaimsMock.mockResolvedValue(mockClaimsResponse);
    generateExternalUISessionMagicLinkTokenMock.mockResolvedValue(mockToken);

    await makeRequest();

    expect(generateExternalUISessionMagicLinkTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        agreement: { id: agreementId, knodeId: "Orion" },
        audience: "test-magic-link-audience",
        consumer: { id: consumerId, knodeId: "Lynx" },
        eservice: {
          id: eserviceId,
          knodeId: "Orion",
          version: eserviceVersionId,
        },
        issuer: "test-magic-link-issuer",
        kid: "test-magic-link-kid",
        producer: { id: producerId, knodeId: "Orion" },
        scope: "agreement-activation",
        secondsDuration: 120,
        subject: agreementId,
      }),
    );
  });

  it("calls agreement-process's activation-claims endpoint with the agreementId path param", async () => {
    getAgreementActivationClaimsMock.mockResolvedValue(mockClaimsResponse);
    generateExternalUISessionMagicLinkTokenMock.mockResolvedValue(mockToken);

    await makeRequest();

    expect(getAgreementActivationClaimsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { agreementId },
      }),
    );
  });

  it("propagates a 404 from agreement-process (agreement not found)", async () => {
    getAgreementActivationClaimsMock.mockRejectedValue(
      makeAxiosError(404, "Agreement Not Found", "001-0005"),
    );

    const response = await makeRequest();

    expect(response.statusCode).toBe(404);
    expect(generateExternalUISessionMagicLinkTokenMock).not.toHaveBeenCalled();
  });

  it("propagates a 409 from agreement-process (agreement not in activatable state)", async () => {
    getAgreementActivationClaimsMock.mockRejectedValue(
      makeAxiosError(409, "Agreement Not In Activatable State", "001-0011"),
    );

    const response = await makeRequest();

    expect(response.statusCode).toBe(409);
    expect(generateExternalUISessionMagicLinkTokenMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the agreementId path param is not a UUID", async () => {
    const response = await makeRequest("not-a-uuid");

    expect(response.statusCode).toBe(400);
    expect(getAgreementActivationClaimsMock).not.toHaveBeenCalled();
    expect(generateExternalUISessionMagicLinkTokenMock).not.toHaveBeenCalled();
  });
});
