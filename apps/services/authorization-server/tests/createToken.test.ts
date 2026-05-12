/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines-per-function */
import type { Agreement } from "@knodia/agreement-models";
import type { EserviceAccessTokenClaims } from "@knodia/common-models/auth";
import type { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";
import type { Purpose } from "@knodia/purpose-models";

import { EXPECTED_CLIENT_ASSERTION_ALGORITHM } from "@knodia/authorization-models/clientAssertion";
import { generateExternalId } from "@knodia/common-models/externalResource";
import { type ConsumerKeychainId, generateId } from "@knodia/common-models/ids";
import { dateToSeconds } from "@knodia/common-models/utils";
import { storeJti } from "@knodia/db-jti-replay-store/utils";
import {
  dpopClaimsValidationError,
  dpopProofAlreadyUsed,
  invalidDpopProofSignature,
} from "@knodia/dpop-validator/errors";
import {
  type Eservice,
  EserviceAccessTokenType,
  type EserviceVersion,
} from "@knodia/eservice-models";
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
import { unknown } from "zod";

import type { API_TokenRequest, API_TokenResponse } from "../src/models/api.ts";

import {
  accessTokenTypeMismatch,
  clientAssertionClaimsValidationError,
  consumerMissingRequiredAttributes,
  invalidClientAssertionSignature,
  platformStatesNotActive,
  publicKeyAlgNotMatchingClientAssertionAlg,
} from "../src/models/errors.ts";
import {
  agreementWriterService,
  app,
  dpopProofHtuBaseUrl,
  dynamoClient,
  dynamoDbDpopProofsTable,
  eserviceWriterService,
  producerKnodeId,
  purposeWriterService,
} from "./setup.ts";

const getConsumerClientAssertionVerificationDataMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@knodia/k2k-gateway-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@knodia/k2k-gateway-client")>();

  return {
    ...original,
    k2kGatewayApi: {
      ...original.k2kGatewayApi,
      getConsumerClientAssertionVerificationData:
        getConsumerClientAssertionVerificationDataMock,
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

  const {
    clientAssertion,
    clientAssertionJWS,
    keySet: clientAssertionKeySet,
    publicKeyEncodedPem,
  } = await getMockClientAssertion({
    standardClaimsOverride: {
      aud: ["test-audience-1"],
      iss: consumerKeychainId,
      purpose_id: purpose.id,
      sub: consumerKeychainId,
    },
  });

  const {
    dpopProofJWS,
    dpopProofJWT,
    keySet: dpopProofKeySet,
  } = await getMockDpopProof({
    props: { customPayload: { htu: `${dpopProofHtuBaseUrl}///?test=12345/` } }, // intentionally malformed htu to test the normalization
  });

  const mockK2KResponse: k2kGatewayApi.ConsumerClientAssertionVerificationResponse =
    {
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

  async function seedTestData(tokenType: EserviceAccessTokenType) {
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
      eserviceWriterService.upsertEservice(
        {
          ...eservice,
          versions: [{ ...eserviceVersion, accessTokenType: tokenType }],
        },
        0,
      ),
      purposeWriterService.upsertPurpose(purpose, 0),
    ]);

    getConsumerClientAssertionVerificationDataMock.mockResolvedValue({
      data: mockK2KResponse,
    });
  }

  beforeEach(() => {
    getConsumerClientAssertionVerificationDataMock.mockReset();
  });

  it.each(EserviceAccessTokenType.options)(
    "should return 200 and a valid %s token",
    async (tokenType) => {
      await seedTestData(tokenType);

      const response = await createToken({
        requestDpopProofJWS: tokenType === "DPoP" ? dpopProofJWS : undefined,
      });

      const responseBody = response.json<API_TokenResponse>();

      expect(response.statusCode).toBe(200);
      expect(responseBody).toEqual({
        access_token: MOCK_TOKEN,
        expires_in: eserviceVersion.accessTokenDuration,
        token_type: tokenType,
      });
    },
  );

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
      getConsumerClientAssertionVerificationDataMock.mockResolvedValue({
        data: mockK2KResponse,
      });

      const clientAssertionJWS = await signJWT({
        jwt: clientAssertion,
        keySet: clientAssertionKeySet,
      });

      const response = await createToken({
        body: {
          ...defaultBody,
          client_assertion: clientAssertionJWS,
        },
      });

      const error = clientAssertionClaimsValidationError(unknown);

      expect(response.statusCode).toBe(401);
      expect(response.json<API_Problem>().title).toEqual(error.title);
    },
  );

  it.each([
    [
      "invalid claim in dpop proof headers",
      {
        ...dpopProofJWT,
        headers: {
          ...dpopProofJWT.headers,
          wrong_claim: "wrong",
        },
      },
    ],
    [
      "invalid claim in dpop proof payload",
      {
        ...dpopProofJWT,
        payload: {
          ...dpopProofJWT.payload,
          wrong_claim: "wrong",
        },
      },
    ],
    [
      "invalid typ claim in dpop proof headers",
      {
        ...dpopProofJWT,
        headers: {
          ...dpopProofJWT.headers,
          typ: "wrong",
        },
      },
    ],
    [
      "missing jwk claim in dpop proof headers",
      {
        ...dpopProofJWT,
        headers: {
          ...dpopProofJWT.headers,
          jwk: undefined,
        },
      },
    ],
    [
      "invalid jwk claim in dpop proof headers",
      {
        ...dpopProofJWT,
        headers: {
          ...dpopProofJWT.headers,
          jwk: {
            ...dpopProofJWT.headers.jwk,
            x: "invalid",
            y: "invalid",
          },
        },
      },
    ],
    [
      "invalid htm claim in dpop proof payload",
      {
        ...dpopProofJWT,
        payload: {
          ...dpopProofJWT.payload,
          htm: "wrong",
        },
      },
    ],
    [
      "invalid htu claim in dpop proof payload",
      {
        ...dpopProofJWT,
        payload: {
          ...dpopProofJWT.payload,
          htu: "wrong",
        },
      },
    ],
    [
      "invalid iat claim in dpop proof payload",
      {
        ...dpopProofJWT,
        payload: {
          ...dpopProofJWT.payload,
          iat: -123,
        },
      },
    ],
    [
      "invalid jti claim in dpop proof payload",
      {
        ...dpopProofJWT,
        payload: {
          ...dpopProofJWT.payload,
          jti: "wrong",
        },
      },
    ],
  ])(
    "should return 401 if the DPoP proof has invalid claims - %s",
    async (_label, dpopProof) => {
      const dpopProofJWS = await signJWT({
        jwt: dpopProof,
        keySet: dpopProofKeySet,
      });

      const response = await createToken({
        requestDpopProofJWS: dpopProofJWS,
      });

      const error = dpopClaimsValidationError(unknown);

      expect(response.statusCode).toBe(401);
      expect(response.json<API_Problem>().title).toEqual(error.title);
    },
  );

  it.each([404, 400, 500])(
    "should return 401 or 500 when the k2k gateway call fails",
    async (status) => {
      const axiosError = new AxiosError("K2K Gateway Error");
      axiosError.status = status;
      getConsumerClientAssertionVerificationDataMock.mockRejectedValue(
        axiosError,
      );

      const response = await createToken();

      expect(response.statusCode).toBe(status === 404 ? 401 : 500);
    },
  );

  it("should return 401 when the client assertion signature is invalid", async () => {
    await Promise.all([
      agreementWriterService.upsertAgreement(agreement, 0),
      eserviceWriterService.upsertEservice(eservice, 0),
      purposeWriterService.upsertPurpose(purpose, 0),
    ]);

    const { publicKeyEncodedPem: invalidPublicKeyEncodedPem } =
      await getMockClientAssertion();

    getConsumerClientAssertionVerificationDataMock.mockResolvedValue({
      data: {
        ...mockK2KResponse,
        publicKey: {
          ...mockK2KResponse.publicKey,
          encodedPem: invalidPublicKeyEncodedPem,
        },
      } satisfies k2kGatewayApi.ConsumerClientAssertionVerificationResponse,
    });

    const response = await createToken();

    const error = invalidClientAssertionSignature();

    expect(response.statusCode).toBe(401);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it("should return 401 when the DPoP signature is invalid", async () => {
    const { keySet: wrongKeySet } = await getMockDpopProof();
    const wrongDpopProofJWS = await signJWT({
      jwt: {
        headers: dpopProofJWT.headers,
        payload: dpopProofJWT.payload,
      },
      keySet: wrongKeySet,
    });

    const response = await createToken({
      requestDpopProofJWS: wrongDpopProofJWS,
    });

    const error = invalidDpopProofSignature();

    expect(response.statusCode).toBe(401);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it("should return 401 if the public key algorithm does not match the client assertion algorithm", async () => {
    const wrongAlg = "ES256";
    getConsumerClientAssertionVerificationDataMock.mockResolvedValue({
      data: {
        ...mockK2KResponse,
        publicKey: { ...mockK2KResponse.publicKey, algorithm: wrongAlg },
      } satisfies k2kGatewayApi.ConsumerClientAssertionVerificationResponse,
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

      getConsumerClientAssertionVerificationDataMock.mockResolvedValue({
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

      getConsumerClientAssertionVerificationDataMock.mockResolvedValue({
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

    getConsumerClientAssertionVerificationDataMock.mockResolvedValue({
      data: {
        ...mockK2KResponse,
        consumerAttributes: [
          {
            code: "vc_organizational_units",
            scheme: "nuts3",
          },
        ],
      } satisfies k2kGatewayApi.ConsumerClientAssertionVerificationResponse,
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
      testCase:
        "E-service version uses DPoP token but request is using Bearer token",
      tokenType: "DPoP",
    },
    {
      testCase:
        "E-service version uses Bearer token but request is using DPoP token",
      tokenType: "Bearer",
    },
  ] satisfies {
    testCase: string;
    tokenType: EserviceAccessTokenType;
  }[])("should return 400 if the $testCase", async ({ tokenType }) => {
    await Promise.all([
      agreementWriterService.upsertAgreement(agreement, 0),
      eserviceWriterService.upsertEservice(
        {
          ...eservice,
          versions: [{ ...eserviceVersion, accessTokenType: tokenType }],
        },
        0,
      ),
      purposeWriterService.upsertPurpose(purpose, 0),
    ]);

    getConsumerClientAssertionVerificationDataMock.mockResolvedValue({
      data: mockK2KResponse,
    });

    const response = await createToken({
      requestDpopProofJWS: tokenType === "Bearer" ? dpopProofJWS : undefined,
    });

    const error = accessTokenTypeMismatch(
      eserviceVersion,
      dpopProofJWS !== undefined,
    );

    expect(response.statusCode).toBe(400);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it("should return 401 if the DPoP proof JTI has been replayed", async () => {
    await seedTestData("DPoP");

    await storeJti({
      dynamoClient,
      expireAtSec: dateToSeconds(new Date()) + 60,
      jti: dpopProofJWT.payload.jti,
      tableName: dynamoDbDpopProofsTable,
    });

    const response = await createToken({
      requestDpopProofJWS: dpopProofJWS,
    });

    const error = dpopProofAlreadyUsed(dpopProofJWT.payload.jti);

    expect(response.statusCode).toBe(401);
    expect(response.json<API_Problem>().errors?.[0]?.detail).toEqual(
      error.errors[0]!.detail,
    );
  });
});
