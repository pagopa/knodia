/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type {
  EserviceAccessTokenClaims,
  InternalTokenClaims,
  UISessionTokenClaims,
} from "@knodia/common-models/auth";
import type { PublicKeyJwk } from "@knodia/common-models/crypto";
import type { NonEmptyArray } from "@knodia/common-models/types";

import { type SignCommand } from "@aws-sdk/client-kms";
import {
  type ExternalResource,
  generateExternalId,
} from "@knodia/common-models/externalResource";
import {
  type ConsumerKeychainId,
  generateId,
  type KnodeId,
  type OrganizationId,
  type PurposeId,
  unsafeBrandId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { getMockDpopProof, getMockEservice } from "@knodia/test-commons/utils";
import { afterAll, assert, beforeAll, describe, expect, it, vi } from "vitest";

import { tokenGeneratorBuilder } from "../src/tokenGenerator.ts";
import { calculateDpopThumbprint } from "../src/utils/utils.ts";
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
        jkt: calculateDpopThumbprint(dpopProofJWT.headers.jwk as PublicKeyJwk),
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
