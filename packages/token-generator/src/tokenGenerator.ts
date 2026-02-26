import type {
  InternalTokenClaims,
  UISessionTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import type { OrganizationId, UserId } from "@knodia/common-models/ids";
import type { NonEmptyArray } from "@knodia/common-models/types";
import type z from "zod";

import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { randomUUID } from "node:crypto";

import type { InternalToken, UISessionToken } from "./models.ts";

const JWT_HEADER_ALG = "RS256";
const JWT_HEADER_TYPE = "at+jwt";
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

interface UISessionInput extends TokenParams {
  organizationId: OrganizationId;
  roles: NonEmptyArray<z.infer<typeof UserRole>>;
  subject: UserId;
}

const b64url = (data: string): string =>
  Buffer.from(data).toString("base64url");

export type TokenGenerator = ReturnType<typeof tokenGeneratorBuilder>;
export function tokenGeneratorBuilder(kmsClient?: KMSClient) {
  const client = kmsClient ?? new KMSClient();

  function getNowInSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  function buildHeader(kid: string): string {
    return b64url(
      JSON.stringify({
        alg: JWT_HEADER_ALG,
        kid,
        typ: JWT_HEADER_TYPE,
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
    claims: InternalTokenClaims | UISessionTokenClaims,
  ): Promise<{ header: string; serialized: string }> {
    const header = buildHeader(kid);
    const payload = b64url(JSON.stringify(claims));
    const message = `${header}.${payload}`;
    const signature = await signWithKms(kid, message);
    return { header, serialized: `${message}.${signature}` };
  }

  return {
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

    async generateUISessionToken(
      input: UISessionInput,
    ): Promise<UISessionToken> {
      const now = getNowInSeconds();
      const claims: UISessionTokenClaims = {
        aud: input.audience,
        exp: now + input.secondsDuration,
        iat: now,
        iss: input.issuer,
        jti: randomUUID(),
        organizationId: input.organizationId,
        roles: input.roles,
        sub: input.subject,
        type: "ui-session",
      };
      const { header, serialized } = await buildAndSignToken(input.kid, claims);
      return { header, payload: claims, serialized, type: "ui-session" };
    },
  };
}
