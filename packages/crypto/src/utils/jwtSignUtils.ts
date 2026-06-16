import type { BaseJwtClaims } from "@knodia/common-models/auth";

import { type KMSClient, SignCommand } from "@aws-sdk/client-kms";

const JWT_HEADER_ALG = "RS256";
const JWT_HEADER_USE = "sig";
const KMS_SIGNING_ALGORITHM = "RSASSA_PKCS1_V1_5_SHA_256";

const b64url = (data: string): string =>
  Buffer.from(data).toString("base64url");

export async function buildAndSignJwt<T extends BaseJwtClaims>(
  kmsClient: KMSClient,
  kid: string,
  claims: T,
): Promise<{ header: string; serialized: string }> {
  const typ =
    "type" in claims && claims.type === "refresh-ui-session" ? "JWT" : "at+jwt";
  const header = buildHeader(kid, typ);
  const payload = b64url(JSON.stringify(claims));
  const message = `${header}.${payload}`;
  const signature = await signWithKms(kmsClient, kid, message);
  return { header, serialized: `${message}.${signature}` };
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
