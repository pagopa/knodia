import {
  type EserviceId,
  type EserviceVersionId,
  generateId,
} from "@knodia/common-models/ids";

const mockKmsSend = vi.hoisted(() => vi.fn());

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

import {
  CONTENT_ENCODING_HEADER,
  CONTENT_TYPE_HEADER,
  DIGEST_HEADER,
  KNODIA_JWT_SIGNATURE_HEADER,
  KnodiaJwtSignatureClaims,
} from "@knodia/integrity-rest-02/models";
import { calculateIntegrityRest02Digest } from "@knodia/integrity-rest-02/utils";
import { decodeProtectedHeader, jwtVerify } from "jose";
import { createSign } from "node:crypto";
import {
  afterEach,
  assert,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  INTEGRITY_REST_02_MOCK_ESERVICE_ID,
  INTEGRITY_REST_02_MOCK_ESERVICE_VERSION_ID,
  INTEGRITY_REST_02_MOCK_PRODUCER_ID,
} from "../../src/integrityRest02/mockup.ts";
import { legalEntityAddressNotFound } from "../../src/models/errors.ts";
import {
  getCtx,
  INTEGRITY_REST_02_SIGNATURE_KID,
  integrityRest02KeySet,
  TEST_KNODE_ID,
} from "../setup.ts";
import { signEserviceAccessToken } from "../utils.ts";

// A UID present in legalEntitiesAddresses.json.
const SAMPLE_UID = "12345678901";
// A UID that exists as a legal entity but has no address entry.
const NO_ADDRESS_UID = "01229430085";

async function getCompanyAddress({
  token,
  uidCompany = SAMPLE_UID,
}: {
  token?: string;
  uidCompany?: string;
} = {}) {
  return await getCtx().app.inject({
    headers: token ? { authorization: `Bearer ${token}` } : {},
    method: "GET",
    url: `/legal-entities/${uidCompany}/address`,
  });
}

async function signToken(
  overrides: {
    eserviceId?: EserviceId;
    eserviceVersionId?: EserviceVersionId;
  } = {},
) {
  return signEserviceAccessToken({
    eserviceId: overrides.eserviceId ?? INTEGRITY_REST_02_MOCK_ESERVICE_ID,
    eserviceVersionId:
      overrides.eserviceVersionId ?? INTEGRITY_REST_02_MOCK_ESERVICE_VERSION_ID,
    knodeId: TEST_KNODE_ID,
    producerId: INTEGRITY_REST_02_MOCK_PRODUCER_ID,
    tokenPrivateKey: getCtx().tokenKeys.tokenPrivateKey,
  });
}

describe("mock-eservice integrity REST 02 router", () => {
  beforeEach(() => {
    mockKmsSend.mockImplementation((cmd: { Message: Uint8Array }) => {
      const sign = createSign("SHA256");
      sign.update(cmd.Message);
      return Promise.resolve({
        Signature: new Uint8Array(
          sign.sign(integrityRest02KeySet.keySet.privateKey),
        ),
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /legal-entities/:uidCompany/address (getCompanyAddress)", () => {
    it("returns 200 with a signed response and verifiable integrity headers", async () => {
      const token = await signToken();
      const res = await getCompanyAddress({ token });

      expect(res.statusCode).toBe(200);

      // --- Knodia-JWT-Signature header must be present ---
      const knodiaJwtSignature =
        res.headers[KNODIA_JWT_SIGNATURE_HEADER.toLowerCase()];
      assert(typeof knodiaJwtSignature === "string");

      // --- Decode the JWT protected header to obtain the kid ---
      // In production a consumer calls GET /producerKeys/:kid to retrieve the
      // matching public key (by the KID found in the JWT header). In this test we use the local RSA public key that
      // the mock KMS used to sign (the "mock response" of that endpoint).
      const jwtHeader = decodeProtectedHeader(knodiaJwtSignature);
      expect(jwtHeader.kid).toBe(INTEGRITY_REST_02_SIGNATURE_KID);

      // --- Verify the JWT signature ---
      const { payload } = await jwtVerify(
        knodiaJwtSignature,
        integrityRest02KeySet.keySet.publicKey,
      );
      const signedHeaders =
        KnodiaJwtSignatureClaims.parse(payload).signed_headers;

      // --- signed_headers.digest must match the Digest response header ---
      const digestResponseHeader = res.headers[DIGEST_HEADER.toLowerCase()];
      const signedDigestEntry = signedHeaders.find(
        (h): h is { [DIGEST_HEADER]: string } => DIGEST_HEADER in h,
      );
      expect(signedDigestEntry).toBeDefined();
      expect(signedDigestEntry?.[DIGEST_HEADER]).toBe(digestResponseHeader);

      // --- Response payload hash must match the Digest header ---
      const computedDigest = calculateIntegrityRest02Digest(res.body);
      expect(computedDigest).toBe(digestResponseHeader);

      // --- content-type in signed_headers must match the response header ---
      const responseContentType =
        res.headers[CONTENT_TYPE_HEADER.toLowerCase()];
      const signedContentTypeEntry = signedHeaders.find(
        (h): h is { [CONTENT_TYPE_HEADER]: string } => CONTENT_TYPE_HEADER in h,
      );
      expect(signedContentTypeEntry).toBeDefined();
      expect(signedContentTypeEntry?.[CONTENT_TYPE_HEADER]).toBe(
        responseContentType,
      );

      // --- content-encoding in signed_headers must match the response header ---
      const responseContentEncoding =
        res.headers[CONTENT_ENCODING_HEADER.toLowerCase()];
      const signedContentEncodingEntry = signedHeaders.find(
        (h): h is { [CONTENT_ENCODING_HEADER]: string } =>
          CONTENT_ENCODING_HEADER in h,
      );
      expect(signedContentEncodingEntry?.[CONTENT_ENCODING_HEADER]).toBe(
        responseContentEncoding,
      );
    });

    it("returns 404 for a company that exists but has no address", async () => {
      const token = await signToken();
      const res = await getCompanyAddress({
        token,
        uidCompany: NO_ADDRESS_UID,
      });

      const error = legalEntityAddressNotFound(NO_ADDRESS_UID);

      expect(res.statusCode).toBe(404);
      expect(res.json().title).toBe(error.title);
    });

    it("returns 400 for a malformed company UID", async () => {
      const token = await signToken();
      const res = await getCompanyAddress({
        token,
        uidCompany: "invalid-uid",
      });

      expect(res.statusCode).toBe(400);
    });

    it("returns 401 for a token issued for a different mock e-service", async () => {
      const token = await signToken({
        eserviceId: generateId<EserviceId>(),
        eserviceVersionId: generateId<EserviceVersionId>(),
      });
      const res = await getCompanyAddress({ token });

      expect(res.statusCode).toBe(401);
    });

    it("returns 401 when the Authorization header is missing", async () => {
      const res = await getCompanyAddress();

      expect(res.statusCode).toBe(401);
    });
  });
});
