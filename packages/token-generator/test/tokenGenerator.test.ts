/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type {
  EserviceAccessTokenClaims,
  ExternalUISessionMagicLinkTokenClaims,
  ExternalUISessionTokenClaims,
  InternalTokenClaims,
  KnodeApiAccessTokenClaims,
  SignupSessionTokenClaims,
  UISessionTokenClaims,
} from "@knodia/common-models/auth";
import type { PublicKeyJwk } from "@knodia/common-models/crypto";
import type { NonEmptyArray } from "@knodia/common-models/types";

import { type SignCommand } from "@aws-sdk/client-kms";
import {
  type ExternalResource,
  generateExternalId,
  toExternalResource,
} from "@knodia/common-models/externalResource";
import {
  type AgreementId,
  type ConsumerKeychainId,
  type EserviceId,
  type EserviceVersionId,
  generateId,
  type KnodeApiKeychainId,
  KnodeId,
  type OrganizationId,
  type PurposeId,
  unsafeBrandId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { getMockDpopProof, getMockEservice } from "@knodia/test-commons/utils";
import { calculateJwkThumbprint } from "jose";
import { afterAll, assert, beforeAll, describe, expect, it, vi } from "vitest";

import { tokenGeneratorBuilder } from "../src/tokenGenerator.ts";
import { kmsSendMock, testKmsClient } from "./utils.ts";

function decodeB64url(s: string): unknown {
  return JSON.parse(Buffer.from(s, "base64url").toString());
}

const KID = "some-fake-key-id";
const SECONDS_DURATION = 600;
const MOCK_NOW_SECONDS = 1_000_000_000;
const generator = tokenGeneratorBuilder(testKmsClient);

// E-service access token data
const consumerKeychainId = generateId<ConsumerKeychainId>();
const knodeApiKeychainId = generateId<KnodeApiKeychainId>();
const consumer: ExternalResource<OrganizationId> = {
  id: generateExternalId(),
  knodeId: "Lynx",
};
const producer: { id: OrganizationId; knodeId: KnodeId } = {
  id: generateId(),
  knodeId: "Orion",
};
const eservice = getMockEservice({ latestVersionState: "Active" });
const eserviceVersion = eservice.versions[0]!;
const purposeId = generateId<PurposeId>();

const { dpopProofJWT } = await getMockDpopProof();

// External-ui-session resource fields shared by the regular and magic-link variants
const externalUISessionResourceInput = {
  agreement: {
    id: unsafeBrandId<AgreementId>("770e8400-e29b-41d4-a716-446655440000"),
    knodeId: KnodeId.enum.Orion,
  },
  consumer: toExternalResource<OrganizationId>(
    "880e8400-e29b-41d4-a716-446655440000",
    KnodeId.enum.Lynx,
  ),
  eservice: {
    id: unsafeBrandId<EserviceId>("990e8400-e29b-41d4-a716-446655440000"),
    knodeId: KnodeId.enum.Orion,
    version: unsafeBrandId<EserviceVersionId>(
      "aa0e8400-e29b-41d4-a716-446655440000",
    ),
  },
  producer: {
    id: unsafeBrandId<OrganizationId>("bb0e8400-e29b-41d4-a716-446655440000"),
    knodeId: KnodeId.enum.Orion,
  },
  scope: "agreement-activation" as const,
};

const externalUISessionExpectedResourceClaims = {
  agreement: {
    id: externalUISessionResourceInput.agreement.id,
    knode_id: externalUISessionResourceInput.agreement.knodeId,
  },
  aud: "my-audience",
  consumer: {
    id: externalUISessionResourceInput.consumer.id,
    knode_id: externalUISessionResourceInput.consumer.knodeId,
  },
  eservice: {
    id: externalUISessionResourceInput.eservice.id,
    knode_id: externalUISessionResourceInput.eservice.knodeId,
    version: externalUISessionResourceInput.eservice.version,
  },
  iss: "my-issuer",
  producer: {
    id: externalUISessionResourceInput.producer.id,
    knode_id: externalUISessionResourceInput.producer.knodeId,
  },
  scope: externalUISessionResourceInput.scope,
  sub: "770e8400-e29b-41d4-a716-446655440000",
};

const testCases = [
  {
    expectedPayload: {
      aud: "my-audience",
      exp: MOCK_NOW_SECONDS + SECONDS_DURATION,
      iat: MOCK_NOW_SECONDS,
      iss: "my-issuer",
      jti: expect.any(String),
      sub: "my-service",
      type: "internal",
    } satisfies InternalTokenClaims,
    generate: () =>
      generator.generateInternalToken({
        audience: "my-audience",
        issuer: "my-issuer",
        kid: KID,
        secondsDuration: SECONDS_DURATION,
        subject: "my-service",
      }),
    name: "generateInternalToken",
    tokenDuration: SECONDS_DURATION,
  },
  {
    expectedPayload: {
      aud: "my-audience",
      exp: MOCK_NOW_SECONDS + SECONDS_DURATION,
      iat: MOCK_NOW_SECONDS,
      iss: "my-issuer",
      jti: expect.any(String),
      organizationId: unsafeBrandId("550e8400-e29b-41d4-a716-446655440000"),
      roles: ["administrative"],
      sub: unsafeBrandUserId("660e8400-e29b-41d4-a716-446655440000"),
      type: "ui-session",
      username: "test-user",
    } satisfies UISessionTokenClaims,
    generate: () =>
      generator.generateUISessionToken({
        audience: "my-audience",
        issuer: "my-issuer",
        kid: KID,
        organizationId: unsafeBrandId("550e8400-e29b-41d4-a716-446655440000"),
        roles: ["administrative"] as NonEmptyArray<"administrative">,
        secondsDuration: SECONDS_DURATION,
        subject: unsafeBrandUserId("660e8400-e29b-41d4-a716-446655440000"),
        username: "test-user",
      }),
    name: "generateUISessionToken",
    tokenDuration: SECONDS_DURATION,
  },
  {
    expectedPayload: {
      aud: ["my-audience"],
      client_id: consumerKeychainId,
      consumer: { id: consumer.id, knode_id: consumer.knodeId },
      eservice: {
        id: eservice.id,
        knode_id: producer.knodeId,
        version: eserviceVersion.id,
      },
      exp: MOCK_NOW_SECONDS + eserviceVersion.accessTokenDuration,
      iat: MOCK_NOW_SECONDS,
      iss: "my-issuer",
      jti: expect.any(String),
      nbf: MOCK_NOW_SECONDS,
      producer: { id: producer.id, knode_id: producer.knodeId },
      purpose: { id: purposeId, knode_id: producer.knodeId },
      sub: consumerKeychainId,
    } satisfies EserviceAccessTokenClaims,
    generate: () =>
      generator.generateEserviceAccessToken({
        audience: ["my-audience"],
        consumer,
        consumerKeychainId,
        eserviceId: eservice.id,
        eserviceVersionId: eserviceVersion.id,
        issuer: "my-issuer",
        kid: KID,
        producer,
        purposeId,
        secondsDuration: eserviceVersion.accessTokenDuration,
        subject: consumerKeychainId,
      }),
    name: "generateBearerEserviceAccessToken",
    tokenDuration: eserviceVersion.accessTokenDuration,
  },
  {
    expectedPayload: {
      aud: ["my-audience"],
      client_id: consumerKeychainId,
      cnf: {
        jkt: await calculateJwkThumbprint(dpopProofJWT.headers.jwk),
      },
      consumer: { id: consumer.id, knode_id: consumer.knodeId },
      eservice: {
        id: eservice.id,
        knode_id: producer.knodeId,
        version: eserviceVersion.id,
      },
      exp: MOCK_NOW_SECONDS + eserviceVersion.accessTokenDuration,
      iat: MOCK_NOW_SECONDS,
      iss: "my-issuer",
      jti: expect.any(String),
      nbf: MOCK_NOW_SECONDS,
      producer: { id: producer.id, knode_id: producer.knodeId },
      purpose: { id: purposeId, knode_id: producer.knodeId },
      sub: consumerKeychainId,
    } satisfies EserviceAccessTokenClaims,
    generate: () =>
      generator.generateEserviceAccessToken({
        audience: ["my-audience"],
        consumer,
        consumerKeychainId,
        dpopJWK: dpopProofJWT.headers.jwk as PublicKeyJwk,
        eserviceId: eservice.id,
        eserviceVersionId: eserviceVersion.id,
        issuer: "my-issuer",
        kid: KID,
        producer,
        purposeId,
        secondsDuration: eserviceVersion.accessTokenDuration,
        subject: consumerKeychainId,
      }),
    name: "generateDpopEserviceAccessToken",
    tokenDuration: eserviceVersion.accessTokenDuration,
  },
  {
    expectedPayload: {
      aud: ["my-audience"],
      client_id: knodeApiKeychainId,
      exp: MOCK_NOW_SECONDS + SECONDS_DURATION,
      iat: MOCK_NOW_SECONDS,
      iss: "my-issuer",
      jti: expect.any(String),
      keychain: { id: knodeApiKeychainId, knode_id: "Orion" as const },
      nbf: MOCK_NOW_SECONDS,
      organization: { id: producer.id, knode_id: "Orion" as const },
      sub: knodeApiKeychainId,
      type: "knode-api",
    } satisfies KnodeApiAccessTokenClaims,
    generate: () =>
      generator.generateKnodeApiAccessToken({
        audience: ["my-audience"],
        issuer: "my-issuer",
        keychain: { id: knodeApiKeychainId, knodeId: "Orion" },
        kid: KID,
        organization: { id: producer.id, knodeId: "Orion" },
        secondsDuration: SECONDS_DURATION,
      }),
    name: "generateKnodeApiAccessToken",
    tokenDuration: SECONDS_DURATION,
  },
  {
    expectedPayload: {
      aud: "my-audience",
      dateOfBirth: "2000-01-01",
      exp: MOCK_NOW_SECONDS + SECONDS_DURATION,
      familyName: "Rossi",
      fiscalNumber: "RSSMRA80A01H501U",
      iat: MOCK_NOW_SECONDS,
      iss: "my-issuer",
      jti: expect.any(String),
      name: "Mario",
      spidCode: "spid-code-123",
      sub: "subject-123",
      type: "signup-session",
    } satisfies SignupSessionTokenClaims,
    generate: () =>
      generator.generateSignupSessionToken({
        audience: "my-audience",
        dateOfBirth: "2000-01-01",
        familyName: "Rossi",
        fiscalNumber: "RSSMRA80A01H501U",
        issuer: "my-issuer",
        kid: KID,
        name: "Mario",
        secondsDuration: SECONDS_DURATION,
        spidCode: "spid-code-123",
        subject: "subject-123",
      }),
    name: "generateSignupSessionToken",
    tokenDuration: SECONDS_DURATION,
  },
  {
    expectedPayload: {
      ...externalUISessionExpectedResourceClaims,
      exp: MOCK_NOW_SECONDS + SECONDS_DURATION,
      iat: MOCK_NOW_SECONDS,
      jti: expect.any(String),
      type: "external-ui-session",
    } satisfies ExternalUISessionTokenClaims,
    generate: () =>
      generator.generateExternalUISessionToken({
        ...externalUISessionResourceInput,
        audience: "my-audience",
        issuer: "my-issuer",
        kid: KID,
        secondsDuration: SECONDS_DURATION,
        subject: "770e8400-e29b-41d4-a716-446655440000",
      }),
    name: "generateExternalUISessionToken",
    tokenDuration: SECONDS_DURATION,
  },
  {
    expectedPayload: {
      ...externalUISessionExpectedResourceClaims,
      exp: MOCK_NOW_SECONDS + SECONDS_DURATION,
      iat: MOCK_NOW_SECONDS,
      jti: expect.any(String),
      type: "external-ui-session-magic-link",
    } satisfies ExternalUISessionMagicLinkTokenClaims,
    generate: () =>
      generator.generateExternalUISessionMagicLinkToken({
        ...externalUISessionResourceInput,
        audience: "my-audience",
        issuer: "my-issuer",
        kid: KID,
        secondsDuration: SECONDS_DURATION,
        subject: "770e8400-e29b-41d4-a716-446655440000",
      }),
    name: "generateExternalUISessionMagicLinkToken",
    tokenDuration: SECONDS_DURATION,
  },
] as const;

describe.each(testCases)(
  "$name",
  ({ expectedPayload, generate, tokenDuration }) => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(MOCK_NOW_SECONDS * 1000));
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it("returns a structured token with a valid signed JWT", async () => {
      const result = await generate();

      // Structured fields
      if ("type" in expectedPayload) {
        assert("type" in result);
        expect(result.type).toBe(expectedPayload.type);
      }
      expect(result.payload).toEqual(expectedPayload);
      expect(result.payload.exp).toBe(result.payload.iat + tokenDuration);

      // JWT structure
      const parts = result.serialized.split(".");
      expect(parts).toHaveLength(3);
      expect(result.header).toBe(parts[0]);
      expect(decodeB64url(parts[0]!)).toMatchObject({
        alg: "RS256",
        kid: KID,
        typ: "at+jwt",
        use: "sig",
      });
      expect(decodeB64url(parts[1]!)).toEqual(result.payload);

      // KMS interaction
      expect(kmsSendMock).toHaveBeenCalledOnce();
      const command = kmsSendMock.mock.calls[0]![0] as SignCommand;
      expect(command.input).toMatchObject({
        KeyId: KID,
        SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
      });
    });

    it("throws when KMS returns no signature", async () => {
      kmsSendMock.mockResolvedValueOnce({ Signature: undefined });

      await expect(generate()).rejects.toThrow(
        "KMS sign returned no signature",
      );
    });
  },
);
