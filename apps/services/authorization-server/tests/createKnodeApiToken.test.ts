/* eslint-disable max-lines-per-function */
import type { KnodeApiAccessTokenClaims } from "@knodia/common-models/auth";
import type { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { EXPECTED_CLIENT_ASSERTION_ALGORITHM } from "@knodia/authorization-models/clientAssertion";
import {
  generateId,
  type KnodeApiKeychainId,
  type OrganizationId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import {
  getMockKnodeApiClientAssertion,
  getMockKnodeApiKeychain,
  signJWT,
} from "@knodia/test-commons/utils";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { unknown } from "zod";

import type {
  API_KnodeApiTokenRequest,
  API_KnodeApiTokenResponse,
} from "../src/models/api.ts";

import {
  clientAssertionClaimsValidationError,
  invalidClientAssertionSignature,
  publicKeyAlgNotMatchingClientAssertionAlg,
} from "../src/models/errors.ts";
import {
  app,
  knodeApiKeychainWriterService,
  producerKnodeId,
} from "./setup.ts";

const getKnodeApiClientAssertionVerificationDataMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getKnodeApiClientAssertionVerificationData:
        getKnodeApiClientAssertionVerificationDataMock,
    },
  };
});

const knodeApiKeychainId = generateId<KnodeApiKeychainId>();
const ownerId = generateId<OrganizationId>();
const MOCK_NOW_SECONDS = 1_000_000_000;
const MOCK_TOKEN = "mock-knode-api-access-token";
const MOCK_TOKEN_DURATION_SECONDS = 3600;
const remoteKnodeId = "Lynx";

vi.mock("@knodia/token-generator", () => ({
  tokenGeneratorBuilder: () => ({
    generateEserviceAccessToken: vi.fn(),
    generateKnodeApiAccessToken: vi.fn().mockImplementation((input) =>
      Promise.resolve({
        payload: {
          aud: ["test-knode-api-audience"],
          client_id: input.keychain.id,
          exp: MOCK_NOW_SECONDS + MOCK_TOKEN_DURATION_SECONDS,
          iat: MOCK_NOW_SECONDS,
          iss: "knodia.org",
          jti: generateId(),
          keychain: {
            id: input.keychain.id,
            knode_id: input.keychain.knodeId,
          },
          nbf: MOCK_NOW_SECONDS,
          organization: {
            id: input.organization.id,
            knode_id: input.organization.knodeId,
          },
          sub: input.keychain.id,
          type: "knode-api",
        } satisfies KnodeApiAccessTokenClaims,
        serialized: MOCK_TOKEN,
      }),
    ),
  }),
}));

describe("POST /knodeApiToken", async () => {
  const VALID_CLIENT_ASSERTION_TYPE =
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
  const VALID_GRANT_TYPE = "client_credentials";

  const {
    clientAssertion,
    clientAssertionJWS,
    keySet: clientAssertionKeySet,
    publicKeyEncodedPem,
  } = await getMockKnodeApiClientAssertion({
    standardClaimsOverride: {
      aud: ["test-audience-1"],
      iss: knodeApiKeychainId,
      knode_id: remoteKnodeId,
      sub: knodeApiKeychainId,
    },
  });

  const mockK2KResponse: k2kGatewayApi.KnodeApiClientAssertionVerificationResponse =
    {
      ownerId,
      publicKey: {
        algorithm: clientAssertion.headers.alg,
        encodedPem: publicKeyEncodedPem,
        format: "PublicKey",
        kid: clientAssertion.headers.kid,
      },
    };

  const defaultBody: API_KnodeApiTokenRequest = {
    client_assertion: clientAssertionJWS,
    client_assertion_type: VALID_CLIENT_ASSERTION_TYPE,
    client_id: knodeApiKeychainId,
    grant_type: VALID_GRANT_TYPE,
  };

  async function createKnodeApiToken({
    body = defaultBody,
  }: { body?: API_KnodeApiTokenRequest } = {}) {
    return app.inject({
      headers: { "content-type": "application/x-www-form-urlencoded" },
      method: "POST",
      payload: new URLSearchParams(body).toString(),
      url: "/knodeApiToken",
    });
  }

  beforeEach(() => {
    getKnodeApiClientAssertionVerificationDataMock.mockReset();
  });

  it("should return 200 and a valid Bearer token for a remote-knode keychain (K2K path)", async () => {
    getKnodeApiClientAssertionVerificationDataMock.mockResolvedValue({
      data: mockK2KResponse,
    });

    const response = await createKnodeApiToken();

    const responseBody = response.json<API_KnodeApiTokenResponse>();

    expect(response.statusCode).toBe(200);
    expect(responseBody).toEqual({
      access_token: MOCK_TOKEN,
      expires_in: MOCK_TOKEN_DURATION_SECONDS,
      token_type: "Bearer",
    });
    expect(getKnodeApiClientAssertionVerificationDataMock).toHaveBeenCalledWith(
      {
        body: {
          keychainId: knodeApiKeychainId,
          kid: clientAssertion.headers.kid,
        },
        client: expect.anything(),
      },
    );
  });

  it("should return 200 for a same-knode keychain via the local readmodel (no K2K call)", async () => {
    const mockKeychain = getMockKnodeApiKeychain();
    const [baseKey] = mockKeychain.keys;
    if (!baseKey) {
      throw new Error("mock keychain unexpectedly has no key");
    }
    await knodeApiKeychainWriterService.upsertKnodeApiKeychain(
      {
        ...mockKeychain,
        id: knodeApiKeychainId,
        keys: [
          {
            ...baseKey,
            algorithm: clientAssertion.headers.alg,
            encodedPem: publicKeyEncodedPem,
            kid: unsafeBrandKeyId(clientAssertion.headers.kid),
          },
        ],
        ownerId,
      },
      0,
    );

    const sameKnodeJWS = await signJWT({
      jwt: {
        headers: clientAssertion.headers,
        payload: {
          ...clientAssertion.payload,
          knode_id: producerKnodeId,
        },
      },
      keySet: clientAssertionKeySet,
    });

    const response = await createKnodeApiToken({
      body: { ...defaultBody, client_assertion: sameKnodeJWS },
    });

    expect(response.statusCode).toBe(200);
    expect(
      getKnodeApiClientAssertionVerificationDataMock,
    ).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid property", { ...defaultBody, wrongProperty: "wrong" }],
    [
      "invalid client_assertion_type",
      { ...defaultBody, client_assertion_type: "InvalidClientAssertionType" },
    ],
    ["invalid grant_type", { ...defaultBody, grant_type: "InvalidGrantType" }],
    [
      "invalid client_assertion format",
      { ...defaultBody, client_assertion: "InvalidClientAssertion" },
    ],
    [
      "invalid client_id",
      { ...defaultBody, client_id: "InvalidKnodeApiKeychainId" },
    ],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      const response = await createKnodeApiToken({ body: body as never });
      expect(response.statusCode).toBe(400);
    },
  );

  it.each([
    [
      "missing knode_id claim",
      {
        ...clientAssertion,
        payload: { ...clientAssertion.payload, knode_id: undefined },
      },
    ],
    [
      "invalid knode_id value",
      {
        ...clientAssertion,
        payload: { ...clientAssertion.payload, knode_id: "Unknown" },
      },
    ],
    [
      "iss does not match client_id",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          iss: generateId<KnodeApiKeychainId>(),
        },
      },
    ],
    [
      "purpose_id present (should be rejected)",
      {
        ...clientAssertion,
        payload: { ...clientAssertion.payload, purpose_id: generateId() },
      },
    ],
    [
      "missing aud claim",
      {
        ...clientAssertion,
        payload: { ...clientAssertion.payload, aud: undefined },
      },
    ],
    [
      "missing sub claim",
      {
        ...clientAssertion,
        payload: { ...clientAssertion.payload, sub: undefined },
      },
    ],
  ])(
    "should return 401 if the client assertion has invalid claims - %s",
    async (_label, assertion) => {
      getKnodeApiClientAssertionVerificationDataMock.mockResolvedValue({
        data: mockK2KResponse,
      });

      const jws = await signJWT({
        jwt: assertion,
        keySet: clientAssertionKeySet,
      });

      const response = await createKnodeApiToken({
        body: { ...defaultBody, client_assertion: jws },
      });

      const error = clientAssertionClaimsValidationError(unknown);

      expect(response.statusCode).toBe(401);
      expect(response.json<API_Problem>().title).toEqual(error.title);
    },
  );

  it("should return 401 if the client assertion signature is invalid", async () => {
    // Mock returns a public key from a different keypair → signature won't verify
    const { publicKeyEncodedPem: otherPubKey } =
      await getMockKnodeApiClientAssertion();
    getKnodeApiClientAssertionVerificationDataMock.mockResolvedValue({
      data: {
        ...mockK2KResponse,
        publicKey: {
          ...mockK2KResponse.publicKey,
          encodedPem: otherPubKey,
        },
      },
    });

    const response = await createKnodeApiToken();

    expect(response.statusCode).toBe(401);
    expect(response.json<API_Problem>().title).toEqual(
      invalidClientAssertionSignature().title,
    );
  });

  it("should return 401 if the public key algorithm does not match the client assertion algorithm", async () => {
    getKnodeApiClientAssertionVerificationDataMock.mockResolvedValue({
      data: {
        ...mockK2KResponse,
        publicKey: { ...mockK2KResponse.publicKey, algorithm: "ES256" },
      },
    });

    const response = await createKnodeApiToken();

    expect(response.statusCode).toBe(401);
    expect(response.json<API_Problem>().title).toEqual(
      publicKeyAlgNotMatchingClientAssertionAlg(
        "ES256",
        EXPECTED_CLIENT_ASSERTION_ALGORITHM,
      ).title,
    );
  });

  it("should return 401 if the K2K Gateway returns 404", async () => {
    getKnodeApiClientAssertionVerificationDataMock.mockRejectedValue(
      new AxiosError(
        "Not Found",
        "404",
        undefined,
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { status: 404 } as any,
      ),
    );

    const response = await createKnodeApiToken();

    expect(response.statusCode).toBe(401);
  });
});
