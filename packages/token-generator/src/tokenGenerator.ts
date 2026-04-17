import type {
  ExternalUISessionMagicLinkTokenClaims,
  ExternalUISessionScope,
  ExternalUISessionTokenClaims,
  InternalTokenClaims,
  UISessionRefreshTokenClaims,
  UISessionTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
  UserId,
} from "@knodia/common-models/ids";
import type { NonEmptyArray } from "@knodia/common-models/types";
import type z from "zod";

import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { randomUUID } from "node:crypto";

import type {
  ExternalUISessionMagicLinkToken,
  ExternalUISessionToken,
  InternalToken,
  UISessionRefreshToken,
  UISessionToken,
} from "./models.ts";

const JWT_HEADER_ALG = "RS256";
const JWT_HEADER_USE = "sig";
const KMS_SIGNING_ALGORITHM = "RSASSA_PKCS1_V1_5_SHA_256";

export interface InternalTokenInput extends TokenParams {
  subject: string;
}

interface ExternalUISessionMagicLinkTokenInput
  extends ExternalUISessionResourceClaims, TokenParams {
  subject: string;
}

interface ExternalUISessionResourceClaims {
  agreementId: AgreementId;
  consumerId: ExternalId<OrganizationId>;
  consumerKnodeId: KnodeId;
  eserviceId: EserviceId;
  eserviceVersionId: EserviceVersionId;
  producerId: OrganizationId;
  scope: ExternalUISessionScope;
}

interface ExternalUISessionTokenInput
  extends ExternalUISessionResourceClaims, TokenParams {
  subject: string;
}

interface TokenParams {
  audience: string;
  issuer: string;
  kid: string;
  secondsDuration: number;
}

interface UISessionTokenInput extends TokenParams {
  organizationId: OrganizationId;
  roles: NonEmptyArray<z.infer<typeof UserRole>>;
  subject: UserId;
  username: string;
}

const b64url = (data: string): string =>
  Buffer.from(data).toString("base64url");

export type TokenGenerator = ReturnType<typeof tokenGeneratorBuilder>;
export function tokenGeneratorBuilder(kmsClient?: KMSClient) {
  const client = kmsClient ?? new KMSClient();

  function getNowInSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

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
      | ExternalUISessionMagicLinkTokenClaims
      | ExternalUISessionTokenClaims
      | InternalTokenClaims
      | UISessionRefreshTokenClaims
      | UISessionTokenClaims,
  ): Promise<{ header: string; serialized: string }> {
    const typ = claims.type === "refresh-ui-session" ? "JWT" : "at+jwt";
    const header = buildHeader(kid, typ);
    const payload = b64url(JSON.stringify(claims));
    const message = `${header}.${payload}`;
    const signature = await signWithKms(kid, message);
    return { header, serialized: `${message}.${signature}` };
  }

  function buildExternalUISessionResourceClaims(
    input: ExternalUISessionResourceClaims & TokenParams & { subject: string },
  ): Omit<ExternalUISessionTokenClaims, "type"> {
    const now = getNowInSeconds();
    return {
      agreementId: input.agreementId,
      aud: input.audience,
      consumerId: input.consumerId,
      consumerKnodeId: input.consumerKnodeId,
      eserviceId: input.eserviceId,
      eserviceVersionId: input.eserviceVersionId,
      exp: now + input.secondsDuration,
      iat: now,
      iss: input.issuer,
      jti: randomUUID(),
      producerId: input.producerId,
      scope: input.scope,
      sub: input.subject,
    };
  }

  function buildUserTokenClaims(
    input: UISessionTokenInput,
  ): Omit<UISessionTokenClaims, "type"> {
    const now = getNowInSeconds();
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
      const now = getNowInSeconds();
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
  };
}
