/* eslint-disable max-lines-per-function */
import type { Agreement } from "@knodia/agreement-models";
import type { EserviceAccessTokenClaims } from "@knodia/common-models/auth";
import type { Eservice, EserviceVersion } from "@knodia/eservice-models";
import type { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";
import type { Purpose } from "@knodia/purpose-models";

import { generateExternalId } from "@knodia/common-models/externalResource";
import { type ConsumerKeychainId, generateId } from "@knodia/common-models/ids";
import {
  getMockAgreement,
  getMockClientAssertion,
  getMockDpopProof,
  getMockEservice,
  getMockEserviceVersion,
  getMockPurpose,
  signJWT,
} from "@knodia/test-commons/utils";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { API_TokenRequest, API_TokenResponse } from "../src/models/api.ts";

import { EXPECTED_CLIENT_ASSERTION_ALGORITHM } from "../src/models/constants.ts";
import {
  accessTokenTypeMismatch,
  consumerMissingRequiredAttributes,
  invalidClientAssertionSignature,
  platformStatesNotActive,
  publicKeyAlgNotMatchingClientAssertionAlg,
} from "../src/models/errors.ts";
import {
  agreementWriterService,
  app,
  dpopProofHtuBaseUrl,
  eserviceWriterService,
  producerKnodeId,
  purposeWriterService,
} from "./setup.ts";

const getClientAssertionVerificationDataMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getClientAssertionVerificationData:
        getClientAssertionVerificationDataMock,
    },
  };
});

const commonAttribute: k2kGatewayApi.Attribute = {
  code: "vc_territorial_units",
  scheme: "nuts1",
};
const purpose: Purpose = {
  ...getMockPurpose(),
  consumer: {
    id: generateExternalId(),
    knodeId: "Lynx",
  },
  state: "Active",
};
const agreement: Agreement = {
  ...getMockAgreement({ seed: 0 }),
  consumer: purpose.consumer,
  eserviceId: purpose.eserviceId,
  state: "Active",
  updatedAt: new Date("2026-03-01"),
};
const eserviceVersion: EserviceVersion = {
  ...getMockEserviceVersion(),
  id: agreement.eserviceVersionId,
  requiredAttributes: [
    [commonAttribute],
    [
      commonAttribute,
      {
        code: "vc_organizational_units",
        scheme: "nuts3",
      },
    ],
  ],
  state: "Active",
};
const eservice: Eservice = {
  ...getMockEservice(),
  id: purpose.eserviceId,
  versions: [eserviceVersion],
};
const consumerKeychainId = generateId<ConsumerKeychainId>();
const MOCK_NOW_SECONDS = 1_000_000_000;
const MOCK_TOKEN = "mock-eservice-access-token";

const { dpopProofJWS } = await getMockDpopProof({
  props: { customPayload: { htu: dpopProofHtuBaseUrl } },
});

vi.mock("@knodia/token-generator", () => ({
  tokenGeneratorBuilder: () => ({
    generateEserviceAccessToken: vi.fn().mockResolvedValue({
      payload: {
        aud: eserviceVersion.accessTokenAudience,
        client_id: consumerKeychainId,
        consumer: {
          id: purpose.consumer.id,
          knode_id: purpose.consumer.knodeId,
        },
        eservice: {
          id: eservice.id,
          knode_id: producerKnodeId,
          version: eserviceVersion.id,
        },
        exp: MOCK_NOW_SECONDS + eserviceVersion.accessTokenDuration,
        iat: MOCK_NOW_SECONDS,
        iss: "knodia.org",
        jti: generateId(),
        nbf: MOCK_NOW_SECONDS,
        producer: { id: agreement.producerId, knode_id: producerKnodeId },
        purpose: { id: purpose.id, knode_id: producerKnodeId },
        sub: consumerKeychainId,
      } satisfies EserviceAccessTokenClaims,
      serialized: MOCK_TOKEN,
    }),
  }),
}));

describe("POST /token", async () => {
  const VALID_CLIENT_ASSERTION_TYPE =
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
  const VALID_GRANT_TYPE = "client_credentials";

  const { clientAssertion, clientAssertionJWS, keySet, publicKeyEncodedPem } =
    await getMockClientAssertion({
      standardClaimsOverride: {
        aud: ["test-audience-1"],
        iss: consumerKeychainId,
        purpose_id: purpose.id,
        sub: consumerKeychainId,
      },
    });

  const mockK2KResponse: k2kGatewayApi.ClientAssertionVerificationResponse = {
    consumerAttributes: [
      commonAttribute,
      {
        code: "vc_organizational_units",
        scheme: "nuts2",
      },
    ],
    publicKey: {
      algorithm: clientAssertion.headers.alg,
      encodedPem: publicKeyEncodedPem,
      format: "PublicKey",
      kid: "kid",
    },
  };

  const defaultBody: API_TokenRequest = {
    client_assertion: clientAssertionJWS,
    client_assertion_type: VALID_CLIENT_ASSERTION_TYPE,
    client_id: consumerKeychainId,
    grant_type: VALID_GRANT_TYPE,
  };

  async function createToken({
    body = defaultBody,
    requestDpopProofJWS,
  }: {
    body?: API_TokenRequest;
    requestDpopProofJWS?: string;
  } = {}) {
    return app.inject({
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        ...(requestDpopProofJWS ? { dpop: requestDpopProofJWS } : {}),
      },
      method: "POST",
      payload: new URLSearchParams(body).toString(),
      url: "/token",
    });
  }

  beforeEach(() => {
    getClientAssertionVerificationDataMock.mockReset();
  });

  it("returns an e-service access token", async () => {
    const archivedAgreement1: Agreement = {
      ...getMockAgreement({ seed: 1 }),
      consumer: purpose.consumer,
      eserviceId: purpose.eserviceId,
      state: "Archived",
      updatedAt: new Date("2026-01-01"),
    };
    const archivedAgreement2: Agreement = {
      ...getMockAgreement({ seed: 2 }),
      consumer: purpose.consumer,
      eserviceId: purpose.eserviceId,
      state: "Archived",
      updatedAt: new Date("2026-02-01"),
    };

    await Promise.all([
      agreementWriterService.upsertAgreement(agreement, 0),
      agreementWriterService.upsertAgreement(archivedAgreement1, 0),
      agreementWriterService.upsertAgreement(archivedAgreement2, 0),
      eserviceWriterService.upsertEservice(eservice, 0),
      purposeWriterService.upsertPurpose(purpose, 0),
    ]);

    getClientAssertionVerificationDataMock.mockResolvedValue({
      data: mockK2KResponse,
    });

    const response = await createToken();

    const responseBody = response.json<API_TokenResponse>();

    expect(response.statusCode).toBe(200);
    expect(responseBody).toEqual({
      access_token: MOCK_TOKEN,
      expires_in: eserviceVersion.accessTokenDuration,
      token_type: "Bearer",
    });
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
      {
        ...defaultBody,
        client_id: "InvalidConsumerKeychainId",
      },
    ],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      const response = await createToken({ body: body as never });
      expect(response.statusCode).toBe(400);
    },
  );

  it.each([
    [
      "invalid claim in client_assertion headers",
      {
        ...clientAssertion,
        headers: {
          ...clientAssertion.headers,
          wrong_claim: "wrong",
        },
      },
    ],
    [
      "invalid claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          wrong_claim: "wrong",
        },
      },
    ],
    [
      "invalid aud claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          aud: ["invalid-audience"],
        },
      },
    ],
    [
      "missing aud claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          aud: undefined,
        },
      },
    ],
    [
      "missing exp claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          exp: undefined,
        },
      },
    ],
    [
      "missing iat claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          iat: undefined,
        },
      },
    ],
    [
      "iss does not match client_id",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          iss: generateId<ConsumerKeychainId>(),
        },
      },
    ],
    [
      "invalid iss format in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          iss: "InvalidIssFormat",
        },
      },
    ],
    [
      "invalid kid format in client_assertion headers",
      {
        ...clientAssertion,
        headers: {
          ...clientAssertion.headers,
          kid: "InvalidKidFormat+",
        },
      },
    ],
    [
      "invalid purpose_id format in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          purpose_id: "InvalidPurposeIdFormat",
        },
      },
    ],
    [
      "sub does not match client_id",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          sub: generateId(),
        },
      },
    ],
    [
      "invalid sub format in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          sub: "InvalidSubFormat",
        },
      },
    ],
    [
      "missing iss claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          iss: undefined,
        },
      },
    ],
    [
      "missing jti claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          jti: undefined,
        },
      },
    ],
    [
      "missing kid claim in client_assertion headers",
      {
        ...clientAssertion,
        headers: {
          ...clientAssertion.headers,
          kid: undefined,
        },
      },
    ],
    [
      "missing purpose_id in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          purpose_id: undefined,
        },
      },
    ],
    [
      "missing sub claim in client_assertion payload",
      {
        ...clientAssertion,
        payload: {
          ...clientAssertion.payload,
          sub: undefined,
        },
      },
    ],
    [
      "missing typ claim in client_assertion headers",
      {
        ...clientAssertion,
        headers: {
          ...clientAssertion.headers,
          typ: undefined,
        },
      },
    ],
  ])(
    "should return 401 if the client assertion has invalid claims - %s",
    async (_label, clientAssertion) => {
      getClientAssertionVerificationDataMock.mockResolvedValue({
        data: mockK2KResponse,
      });

      const clientAssertionJWS = await signJWT({
        jwt: clientAssertion,
        keySet,
      });

      const response = await createToken({
        body: {
          ...defaultBody,
          client_assertion: clientAssertionJWS,
        },
      });

      expect(response.statusCode).toBe(401);
    },
  );

  it("should return 500 when the k2k gateway call fails", async () => {
    getClientAssertionVerificationDataMock.mockRejectedValue(
      new AxiosError("k2k gateway error"),
    );

    const response = await createToken();

    expect(response.statusCode).toBe(500);
  });

  it("should return 401 when the client assertion signature is invalid", async () => {
    await Promise.all([
      agreementWriterService.upsertAgreement(agreement, 0),
      eserviceWriterService.upsertEservice(eservice, 0),
      purposeWriterService.upsertPurpose(purpose, 0),
    ]);

    const { publicKeyEncodedPem: invalidPublicKeyEncodedPem } =
      await getMockClientAssertion();

    getClientAssertionVerificationDataMock.mockResolvedValue({
      data: {
        ...mockK2KResponse,
        publicKey: {
          ...mockK2KResponse.publicKey,
          encodedPem: invalidPublicKeyEncodedPem,
        },
      } satisfies k2kGatewayApi.ClientAssertionVerificationResponse,
    });

    const response = await createToken();

    const error = invalidClientAssertionSignature();

    expect(response.statusCode).toBe(401);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it("should return 401 if the public key algorithm does not match the client assertion algorithm", async () => {
    const wrongAlg = "ES256";
    getClientAssertionVerificationDataMock.mockResolvedValue({
      data: {
        ...mockK2KResponse,
        publicKey: { ...mockK2KResponse.publicKey, algorithm: wrongAlg },
      } satisfies k2kGatewayApi.ClientAssertionVerificationResponse,
    });

    const response = await createToken();

    const error = publicKeyAlgNotMatchingClientAssertionAlg(
      wrongAlg,
      EXPECTED_CLIENT_ASSERTION_ALGORITHM,
    );

    expect(response.statusCode).toBe(401);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it.each([
    {
      agreement: {
        ...agreement,
        state: "Suspended",
      },
      eserviceVersion,
      purpose,
      testCase: "agreement not active",
    },
    {
      agreement,
      eserviceVersion: {
        ...eserviceVersion,
        state: "Suspended",
      },
      purpose,
      testCase: "e-service version not active",
    },
    {
      agreement,
      eserviceVersion,
      purpose: {
        ...purpose,
        state: "Suspended",
      },
      testCase: "purpose not active",
    },
    {
      agreement: {
        ...agreement,
        state: "Suspended",
      },
      eserviceVersion: {
        ...eserviceVersion,
        state: "Suspended",
      },
      purpose: {
        ...purpose,
        state: "Suspended",
      },
      testCase: "all platform objects not active",
    },
  ] satisfies {
    agreement: Agreement;
    eserviceVersion: EserviceVersion;
    purpose: Purpose;
    testCase: string;
  }[])(
    "should return 400 when platform states are not active: $testCase (seed #%#)",
    async ({ agreement, eserviceVersion, purpose }) => {
      await Promise.all([
        agreementWriterService.upsertAgreement(agreement, 0),
        eserviceWriterService.upsertEservice(
          { ...eservice, versions: [eserviceVersion] },
          0,
        ),
        purposeWriterService.upsertPurpose(purpose, 0),
      ]);

      getClientAssertionVerificationDataMock.mockResolvedValue({
        data: mockK2KResponse,
      });

      const response = await createToken();

      const error = platformStatesNotActive([]);

      expect(response.statusCode).toBe(400);
      expect(response.json<API_Problem>().title).toEqual(error.title);
    },
  );

  it.each([
    {
      agreement: undefined,
      eserviceVersion,
      purpose,
      testCase: "agreement not found",
    },
    {
      agreement,
      eserviceVersion: undefined,
      purpose,
      testCase: "e-service version not found",
    },
    {
      agreement,
      eserviceVersion,
      purpose: undefined,
      testCase: "purpose not found",
    },
  ] satisfies {
    agreement: Agreement | undefined;
    eserviceVersion: EserviceVersion | undefined;
    purpose: Purpose | undefined;
    testCase: string;
  }[])(
    "should return 400 when platform objects are not found: $testCase (seed #%#)",
    async ({ agreement, eserviceVersion, purpose }) => {
      await Promise.all([
        agreement
          ? agreementWriterService.upsertAgreement(agreement, 0)
          : Promise.resolve(),
        eserviceVersion
          ? eserviceWriterService.upsertEservice(
              { ...eservice, versions: [eserviceVersion] },
              0,
            )
          : Promise.resolve(),
        purpose
          ? purposeWriterService.upsertPurpose(purpose, 0)
          : Promise.resolve(),
      ]);

      getClientAssertionVerificationDataMock.mockResolvedValue({
        data: mockK2KResponse,
      });

      const response = await createToken();

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 400 when the Consumer Attributes do not meet the E-service version Required Attributes", async () => {
    await Promise.all([
      agreementWriterService.upsertAgreement(agreement, 0),
      eserviceWriterService.upsertEservice(eservice, 0),
      purposeWriterService.upsertPurpose(purpose, 0),
    ]);

    getClientAssertionVerificationDataMock.mockResolvedValue({
      data: {
        ...mockK2KResponse,
        consumerAttributes: [
          {
            code: "vc_organizational_units",
            scheme: "nuts3",
          },
        ],
      } satisfies k2kGatewayApi.ClientAssertionVerificationResponse,
    });

    const response = await createToken();

    const error = consumerMissingRequiredAttributes(
      purpose.consumer,
      eserviceVersion.id,
    );

    expect(response.statusCode).toBe(400);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it.each([
    {
      dpopProofJWS: undefined,
      eserviceVersion: {
        ...eserviceVersion,
        accessTokenType: "DPoP",
      },
      testCase:
        "E-service version uses DPoP token but request is using Bearer token",
    },
    {
      dpopProofJWS,
      eserviceVersion: {
        ...eserviceVersion,
        accessTokenType: "Bearer",
      },
      testCase:
        "E-service version uses Bearer token but request is using DPoP token",
    },
  ] satisfies {
    dpopProofJWS: string | undefined;
    eserviceVersion: EserviceVersion;
    testCase: string;
  }[])(
    "should return 400 if the E-service version access token type does not match the request token type: $testCase",
    async ({ dpopProofJWS, eserviceVersion }) => {
      await Promise.all([
        agreementWriterService.upsertAgreement(agreement, 0),
        eserviceWriterService.upsertEservice(
          { ...eservice, versions: [eserviceVersion] },
          0,
        ),
        purposeWriterService.upsertPurpose(purpose, 0),
      ]);

      getClientAssertionVerificationDataMock.mockResolvedValue({
        data: mockK2KResponse,
      });

      const response = await createToken({ requestDpopProofJWS: dpopProofJWS });

      const error = accessTokenTypeMismatch(
        eserviceVersion,
        dpopProofJWS !== undefined,
      );

      expect(response.statusCode).toBe(400);
      expect(response.json<API_Problem>().title).toEqual(error.title);
    },
  );
});
