import type { BaseJwtClaims } from "@knodia/common-models/auth";

import { type KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { match, P } from "ts-pattern";

const JWT_HEADER_ALG = "RS256";
const JWT_HEADER_USE = "sig";
const KMS_SIGNING_ALGORITHM = "RSASSA_PKCS1_V1_5_SHA_256";

const b64url = (data: string): string =>
  Buffer.from(data).toString("base64url");

export async function buildAndSignJwt<T extends BaseJwtClaims>(
  kmsClient: KMSClient,
  kid: string,
  claims: T,
  headerKid?: string,
): Promise<{
  claims: Omit<T, "type"> | T;
  header: string;
  serialized: string;
}> {
  const typ = match(claims.type)
    .with(
      "eservice-access",
      "external-ui-session",
      "external-ui-session-magic-link",
      "internal",
      "knode-api",
      "ui-session",
      "ui-signup-session",
      () => "at+jwt",
    )
    .with("refresh-ui-session", "knodia-jwt-signature", () => "JWT")
    .exhaustive();
  const header = buildHeader(headerKid ?? kid, typ);

  const cleanedClaims = match(claims.type)
    .with("eservice-access", "knodia-jwt-signature", () => {
      // Strip the `type` field from the claims for these token types, as they are not expected to be present in the JWT payload.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { type, ...rest } = claims;
      return rest;
    })
    .with(
      P.union(
        "external-ui-session",
        "external-ui-session-magic-link",
        "internal",
        "knode-api",
        "refresh-ui-session",
        "ui-session",
        "ui-signup-session",
      ),
      () => claims,
    )
    .exhaustive();
  const payload = b64url(JSON.stringify(cleanedClaims));
  const message = `${header}.${payload}`;
  const signature = await signWithKms(kmsClient, kid, message);
  return {
    claims: cleanedClaims,
    header,
    serialized: `${message}.${signature}`,
  };
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

async function signWithKms(
  kmsClient: KMSClient,
  kid: string,
  message: string,
): Promise<string> {
  const { Signature } = await kmsClient.send(
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
