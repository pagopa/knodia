import type {
  InternalTokenClaims,
  UISessionRefreshTokenClaims,
  UISessionTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import type { OrganizationId, UserId } from "@knodia/common-models/ids";
import type { NonEmptyArray } from "@knodia/common-models/types";
import type z from "zod";

import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { dateToSeconds } from "@knodia/common-models/utils";
import { randomUUID } from "node:crypto";

import type {
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
