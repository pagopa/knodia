import {
  type EserviceAccessTokenClaims,
  type KnodeApiAccessTokenClaims,
} from "@knodia/common-models/auth";
import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  type ConsumerKeychainId,
  type EserviceId,
  type EserviceVersionId,
  generateId,
  type KnodeApiKeychainId,
  KnodeId,
  type OrganizationId,
  type PurposeId,
} from "@knodia/common-models/ids";
import { dateToSeconds } from "@knodia/common-models/utils";
import { type CryptoKey, SignJWT } from "jose";
import { randomUUID } from "node:crypto";

import { ACCEPTED_AUDIENCES, EXPECTED_ISSUER, TEST_KID } from "./setup.ts";

interface SignAccessTokenInput {
  audience?: string | string[];
  eserviceId: EserviceId;
  eserviceVersionId: EserviceVersionId;
  expiresIn?: string;
  issuer?: string;
  knodeId: KnodeId;
  payload?: Record<string, unknown>;
  producerId: OrganizationId;
  tokenPrivateKey: CryptoKey;
  typ?: string;
}

interface SignKnodeApiTokenInput {
  audience?: string | string[];
  expiresIn?: string;
  issuer?: string;
  knodeId: KnodeId;
  organizationId: OrganizationId;
  payload?: Record<string, unknown>;
  tokenPrivateKey: CryptoKey;
  typ?: string;
}

// Builds a signed e-service access token with the claims `mock-eservice` expects.
// Callers in each router test wrap this with their per-e-service defaults
// (EXPECTED_*_ID constants); negative-case tests override `payload`, `audience`,
// `issuer`, `expiresIn`, or `typ` to break a specific claim.
export async function signEserviceAccessToken({
  audience,
  eserviceId,
  eserviceVersionId,
  expiresIn = "5m",
  issuer,
  knodeId,
  payload,
  producerId,
  tokenPrivateKey,
  typ = "at+jwt",
}: SignAccessTokenInput): Promise<string> {
  const otherKnodeId =
    knodeId === KnodeId.enum.Orion ? KnodeId.enum.Lynx : KnodeId.enum.Orion;
  const now = dateToSeconds(new Date());
  const defaultPayload: Partial<EserviceAccessTokenClaims> = {
    client_id: generateId<ConsumerKeychainId>(),
    consumer: {
      id: generateExternalId<OrganizationId>(),
      knode_id: otherKnodeId,
    },
    eservice: {
      id: eserviceId,
      knode_id: knodeId,
      version: eserviceVersionId,
    },
    nbf: now,
    producer: { id: producerId, knode_id: knodeId },
    purpose: { id: generateId<PurposeId>(), knode_id: knodeId },
  };

  return new SignJWT({ ...defaultPayload, ...payload })
    .setProtectedHeader({ alg: "RS256", kid: TEST_KID, typ })
    .setSubject(randomUUID())
    .setIssuer(issuer ?? EXPECTED_ISSUER)
    .setAudience(audience ?? ACCEPTED_AUDIENCES)
    .setJti(randomUUID())
    .setIssuedAt(now)
    .setExpirationTime(expiresIn)
    .sign(tokenPrivateKey);
}

// Builds a signed Knode API token, the credential the producer uses to publish
// Signal Hub signals and (in the POC UC02 demo) to authorize the evidence-update
// route. Negative-case tests override `issuer` or `organizationId` to break a
// specific claim.
export async function signKnodeApiAccessToken({
  audience = "signalhub.test.knodia.org",
  expiresIn = "5m",
  issuer,
  knodeId,
  organizationId,
  payload,
  tokenPrivateKey,
  typ = "at+jwt",
}: SignKnodeApiTokenInput): Promise<string> {
  const now = dateToSeconds(new Date());
  const keychainId = generateId<KnodeApiKeychainId>();
  const defaultPayload: Partial<KnodeApiAccessTokenClaims> = {
    client_id: keychainId,
    keychain: { id: keychainId, knode_id: knodeId },
    nbf: now,
    organization: { id: organizationId, knode_id: knodeId },
    type: "knode-api",
  };

  return new SignJWT({ ...defaultPayload, ...payload })
    .setProtectedHeader({ alg: "RS256", kid: TEST_KID, typ })
    .setSubject(keychainId)
    .setIssuer(issuer ?? EXPECTED_ISSUER)
    .setAudience(audience)
    .setJti(randomUUID())
    .setIssuedAt(now)
    .setExpirationTime(expiresIn)
    .sign(tokenPrivateKey);
}
