import type {
  ExternalId,
  ExternalResource,
} from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  ConsumerKeychainId,
  EserviceId,
  EserviceVersionId,
  KnodeApiKeychainId,
  KnodeId,
  OrganizationId,
  PurposeId,
  UserId,
} from "@knodia/common-models/ids";
import type { NonEmptyArray } from "@knodia/common-models/types";
import type z from "zod";

import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import {
  type EserviceAccessTokenClaims,
  type ExternalUISessionMagicLinkTokenClaims,
  type ExternalUISessionScope,
  type ExternalUISessionTokenClaims,
  type InternalTokenClaims,
  type KnodeApiAccessTokenClaims,
  selectSignupIdentifier,
  type UISessionRefreshTokenClaims,
  type UISessionTokenClaims,
  UISignupSessionTokenClaims,
  type UserRole,
} from "@knodia/common-models/auth";
import { type PublicKeyJwk } from "@knodia/common-models/crypto";
import { dateToSeconds } from "@knodia/common-models/utils";
import { calculateJwkThumbprint } from "jose";
import { randomUUID } from "node:crypto";

import type {
  EserviceAccessToken,
  ExternalUISessionMagicLinkToken,
  ExternalUISessionToken,
  InternalToken,
  KnodeApiAccessToken,
  UISessionRefreshToken,
  UISessionToken,
  UISignupSessionToken,
} from "./models.ts";

const JWT_HEADER_ALG = "RS256";
const JWT_HEADER_USE = "sig";
const KMS_SIGNING_ALGORITHM = "RSASSA_PKCS1_V1_5_SHA_256";

export interface InternalTokenInput extends TokenParams {
  audience: string;
  subject: string;
}

interface EserviceAccessTokenInput extends TokenParams {
  audience: string[];
  consumer: ExternalResource<OrganizationId>;
  consumerKeychainId: ConsumerKeychainId; // access token client_id claim
  dpopJWK?: PublicKeyJwk;
  eserviceId: EserviceId;
  eserviceVersionId: EserviceVersionId;
  producer: { id: OrganizationId; knodeId: KnodeId };
  purposeId: PurposeId;
  subject: ConsumerKeychainId;
}

// Magic-link tokens accept the same input shape as regular external-ui-session
// tokens; only the JWT `type` literal differs.
type ExternalUISessionMagicLinkTokenInput = ExternalUISessionTokenInput;

interface ExternalUISessionResourceInput {
  agreement: { id: AgreementId; knodeId: KnodeId };
  consumer: { id: ExternalId<OrganizationId>; knodeId: KnodeId };
  eservice: { id: EserviceId; knodeId: KnodeId; version: EserviceVersionId };
  producer: { id: OrganizationId; knodeId: KnodeId };
  scope: ExternalUISessionScope;
}

interface ExternalUISessionTokenInput
  extends ExternalUISessionResourceInput, TokenParams {
  audience: string;
  subject: string;
}

interface KnodeApiAccessTokenInput extends TokenParams {
  audience: string[];
  keychain: { id: KnodeApiKeychainId; knodeId: KnodeId };
  organization: { id: OrganizationId; knodeId: KnodeId };
}

interface TokenParams {
  issuer: string;
  kid: string;
  secondsDuration: number;
}

interface UISessionTokenInput extends TokenParams {
  audience: string;
  organizationId: OrganizationId;
  roles: NonEmptyArray<z.infer<typeof UserRole>>;
  subject: UserId;
  username: string;
}

interface UISignupSessionTokenInput extends TokenParams {
  audience: string;
  dateOfBirth: string;
  familyName: string;
  fiscalNumber: string | undefined;
  name: string;
  oneIdNonce: string;
  PersonIdentifier: string | undefined;
  spidCode: string | undefined;
}

const b64url = (data: string): string =>
  Buffer.from(data).toString("base64url");

export type TokenGenerator = ReturnType<typeof tokenGeneratorBuilder>;
// eslint-disable-next-line max-lines-per-function
export function tokenGeneratorBuilder(kmsClient?: KMSClient) {
  const client = kmsClient ?? new KMSClient();

  function buildHeader(kid: string, typ: string): string {
    return b64url(
      JSON.stringify({
        alg: JWT_HEADER_ALG,
        kid,
        typ,
        use: JWT_HEADER_USE,
      }),
    );
  }

  async function signWithKms(kid: string, message: string): Promise<string> {
    const { Signature } = await client.send(
      new SignCommand({
        KeyId: kid,
        Message: new TextEncoder().encode(message),
        SigningAlgorithm: KMS_SIGNING_ALGORITHM,
      }),
    );

    if (!Signature) {
      throw new Error("KMS sign returned no signature");
    }

    return Buffer.from(Signature).toString("base64url");
  }

  async function buildAndSignToken(
    kid: string,
    claims:
      | EserviceAccessTokenClaims
      | ExternalUISessionMagicLinkTokenClaims
      | ExternalUISessionTokenClaims
      | InternalTokenClaims
      | KnodeApiAccessTokenClaims
      | UISessionRefreshTokenClaims
      | UISessionTokenClaims
      | UISignupSessionTokenClaims,
  ): Promise<{ header: string; serialized: string }> {
    const typ =
      "type" in claims && claims.type === "refresh-ui-session"
        ? "JWT"
        : "at+jwt";
    const header = buildHeader(kid, typ);
    const payload = b64url(JSON.stringify(claims));
    const message = `${header}.${payload}`;
    const signature = await signWithKms(kid, message);
    return { header, serialized: `${message}.${signature}` };
  }

  function buildExternalUISessionResourceClaims(
    input: ExternalUISessionTokenInput,
  ): Omit<ExternalUISessionTokenClaims, "type"> {
    const now = dateToSeconds(new Date());
    return {
      agreement: { id: input.agreement.id, knode_id: input.agreement.knodeId },
      aud: input.audience,
      consumer: { id: input.consumer.id, knode_id: input.consumer.knodeId },
      eservice: {
        id: input.eservice.id,
        knode_id: input.eservice.knodeId,
        version: input.eservice.version,
      },
      exp: now + input.secondsDuration,
      iat: now,
      iss: input.issuer,
      jti: randomUUID(),
      producer: { id: input.producer.id, knode_id: input.producer.knodeId },
      scope: input.scope,
      sub: input.subject,
    };
  }

  function buildUserTokenClaims(
    input: UISessionTokenInput,
  ): Omit<UISessionTokenClaims, "type"> {
    const now = dateToSeconds(new Date());
    return {
      aud: input.audience,
      exp: now + input.secondsDuration,
      iat: now,
      iss: input.issuer,
      jti: randomUUID(),
      organizationId: input.organizationId,
      roles: input.roles,
      sub: input.subject,
      username: input.username,
    };
  }

  return {
    async generateEserviceAccessToken(
      input: EserviceAccessTokenInput,
    ): Promise<EserviceAccessToken> {
      const now = dateToSeconds(new Date());
      const claims: EserviceAccessTokenClaims = {
        aud: input.audience,
        client_id: input.consumerKeychainId,
        cnf: input.dpopJWK
          ? { jkt: await calculateJwkThumbprint(input.dpopJWK) }
          : undefined,
        consumer: { id: input.consumer.id, knode_id: input.consumer.knodeId },
        eservice: {
          id: input.eserviceId,
          knode_id: input.producer.knodeId,
          version: input.eserviceVersionId,
        },
        exp: now + input.secondsDuration,
        iat: now,
        iss: input.issuer,
        jti: randomUUID(),
        nbf: now,
        producer: { id: input.producer.id, knode_id: input.producer.knodeId },
        purpose: { id: input.purposeId, knode_id: input.producer.knodeId },
        sub: input.subject,
      };

      const { header, serialized } = await buildAndSignToken(input.kid, claims);

      return {
        header,
        payload: claims,
        serialized,
      };
    },

    async generateExternalUISessionMagicLinkToken(
      input: ExternalUISessionMagicLinkTokenInput,
    ): Promise<ExternalUISessionMagicLinkToken> {
      const claims: ExternalUISessionMagicLinkTokenClaims = {
        ...buildExternalUISessionResourceClaims(input),
        type: "external-ui-session-magic-link",
      };
      const { header, serialized } = await buildAndSignToken(input.kid, claims);
      return {
        header,
        payload: claims,
        serialized,
        type: "external-ui-session-magic-link",
      };
    },

    async generateExternalUISessionToken(
      input: ExternalUISessionTokenInput,
    ): Promise<ExternalUISessionToken> {
      const claims: ExternalUISessionTokenClaims = {
        ...buildExternalUISessionResourceClaims(input),
        type: "external-ui-session",
      };
      const { header, serialized } = await buildAndSignToken(input.kid, claims);
      return {
        header,
        payload: claims,
        serialized,
        type: "external-ui-session",
      };
    },

    async generateInternalToken(
      input: InternalTokenInput,
    ): Promise<InternalToken> {
      const now = dateToSeconds(new Date());
      const claims: InternalTokenClaims = {
        aud: input.audience,
        exp: now + input.secondsDuration,
        iat: now,
        iss: input.issuer,
        jti: randomUUID(),
        sub: input.subject,
        type: "internal",
      };
      const { header, serialized } = await buildAndSignToken(input.kid, claims);
      return { header, payload: claims, serialized, type: "internal" };
    },

    async generateKnodeApiAccessToken(
      input: KnodeApiAccessTokenInput,
    ): Promise<KnodeApiAccessToken> {
      const now = dateToSeconds(new Date());
      const claims: KnodeApiAccessTokenClaims = {
        aud: input.audience,
        client_id: input.keychain.id,
        exp: now + input.secondsDuration,
        iat: now,
        iss: input.issuer,
        jti: randomUUID(),
        keychain: { id: input.keychain.id, knode_id: input.keychain.knodeId },
        nbf: now,
        organization: {
          id: input.organization.id,
          knode_id: input.organization.knodeId,
        },
        sub: input.keychain.id,
        type: "knode-api",
      };

      const { header, serialized } = await buildAndSignToken(input.kid, claims);

      return {
        header,
        payload: claims,
        serialized,
        type: "knode-api",
      };
    },

    async generateUIRefreshToken(
      input: UISessionTokenInput,
    ): Promise<UISessionRefreshToken> {
      const claims: UISessionRefreshTokenClaims = {
        ...buildUserTokenClaims(input),
        type: "refresh-ui-session",
      };
      const { header, serialized } = await buildAndSignToken(input.kid, claims);
      return {
        header,
        payload: claims,
        serialized,
        type: "refresh-ui-session",
      };
    },

    async generateUISessionToken(
      input: UISessionTokenInput,
    ): Promise<UISessionToken> {
      const claims: UISessionTokenClaims = {
        ...buildUserTokenClaims(input),
        type: "ui-session",
      };
      const { header, serialized } = await buildAndSignToken(input.kid, claims);
      return { header, payload: claims, serialized, type: "ui-session" };
    },

    async generateUISignupSessionToken(
      input: UISignupSessionTokenInput,
    ): Promise<UISignupSessionToken> {
      const now = dateToSeconds(new Date());

      // We persist exactly one identifier (SPID returns both spidCode and
      // fiscalNumber): keep only the precedence winner so a SPID login never
      // stores its fiscalNumber, which would collide with a later CIE login of
      // the same person. The codec's parse below rejects zero (or >1) identifier.
      const identifier = selectSignupIdentifier({
        fiscalNumber: input.fiscalNumber,
        personIdentifier: input.PersonIdentifier,
        spidCode: input.spidCode,
      });

      const claims = UISignupSessionTokenClaims.parse({
        aud: input.audience,
        dateOfBirth: input.dateOfBirth,
        exp: now + input.secondsDuration,
        familyName: input.familyName,
        iat: now,
        iss: input.issuer,
        jti: randomUUID(),
        name: input.name,
        oneIdNonce: input.oneIdNonce,
        // sub mirrors the single chosen identifier.
        sub: identifier?.value,
        type: "ui-signup-session",
        ...(identifier && { [identifier.field]: identifier.value }),
      });
      const { header, serialized } = await buildAndSignToken(input.kid, claims);
      return { header, payload: claims, serialized, type: "ui-signup-session" };
    },
  };
}
