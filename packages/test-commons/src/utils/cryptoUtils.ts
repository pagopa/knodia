import { Algorithm } from "@knodia/common-models/algorithms";
import { createPrivateKey, generateKeyPairSync } from "crypto";
import { type JWTHeaderParameters, type JWTPayload, SignJWT } from "jose";
import { match } from "ts-pattern";

export const toBase64 = (value: string) =>
  Buffer.from(value, "utf-8").toString("base64");

export const createRsaKeyPair = (modulusLength: number) =>
  generateKeyPairSync("rsa", {
    modulusLength,
    privateKeyEncoding: {
      format: "pem",
      type: "pkcs8",
    },
    publicKeyEncoding: {
      format: "pem",
      type: "spki",
    },
  });

export const createEcKeyPair = () =>
  generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
    privateKeyEncoding: {
      format: "pem",
      type: "pkcs8",
    },
    publicKeyEncoding: {
      format: "pem",
      type: "spki",
    },
  });

export const rsaX509CertificatePem = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIUaTGJhqRlY/7J2yUYoHQILYTqCaAwDQYJKoZIhvcNAQEL
BQAwFjEUMBIGA1UEAwwLa25vZGlhLXRlc3QwHhcNMjYwNDAyMTUzODQxWhcNMjYw
NDAzMTUzODQxWjAWMRQwEgYDVQQDDAtrbm9kaWEtdGVzdDCCASIwDQYJKoZIhvcN
AQEBBQADggEPADCCAQoCggEBAJm5+TX/VLuYbMZD9Q0A1X2DOn0P9m04HXr60Qno
GLT7kXjjfXle54NQy4UQBvaKHcC0m3+1HZIK/SBjIb7oqTyVeHcabkg9bkrNd27X
ShaJMMkzK64vaQwsZet/TUip1VxKaYBviDFTRTxRuuw/Zhc+dCIFNJlHnsCNEP7Q
XSUTmsQ0Xottgasp6EAJ3vhR36eBlykI5n9qNOTtsKVEzI9yIjNR1/Fmm17l00jm
KwPiuRZBNzPtnfrr5ODZpxlsA+j8bsMAbPnSGY2geLT6S3awLn6bY/uB3FZjlzQ9
+RTax3TqXyRrVbKGTaEftVZHQkR+Q32xOdCrSsh/VByn0UcCAwEAAaNTMFEwHQYD
VR0OBBYEFAFKpwDNduJ2rCODTlJFQwrh7JJdMB8GA1UdIwQYMBaAFAFKpwDNduJ2
rCODTlJFQwrh7JJdMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEB
ABIQk+6qDYuK96z344006R4mVZlk7+uVvQ5LRRMNNoo2QRbEYrHOrPzUfK4NB7ES
/I8cjqTagMinrb/2r+sfvAKfdVD5+a0BKtsKpWz/eAAwfGHb/7mL+aoejQbFT5+G
NkBdKFk0r+U+fNZKt6gkEkvSJoJYvam+EnyKzNy4feCP2TYRsli+lqJYaJxmbd2H
780ap02wm2irjBaCoW3ODVHUbzsEIcEMH3oHeMuXP5kdOtXVPdYFM24WGtBN6LNU
e8gii0NdJ5Sv/VTFpB11GXvlDOKV7w2hRbx8vvkLL0THvq0s5YmcRg6Urqm82n8y
wDbhe/fDrePo0lGawqs+LRA=
-----END CERTIFICATE-----`;

export function generateKeySet(alg: Algorithm = Algorithm.enum.RS256) {
  const keySet = match(alg)
    .with(Algorithm.enum.RS256, () =>
      generateKeyPairSync("rsa", {
        modulusLength: 2048,
      }),
    )
    .with(Algorithm.enum.ES256, () =>
      generateKeyPairSync("ec", {
        namedCurve: "P-256", // This is the curve for ES256
      }),
    )
    .exhaustive();

  const pemPublicKey = keySet.publicKey
    .export({
      format: "pem",
      type: "spki",
    })
    .toString();

  const publicKeyJwk = keySet.publicKey.export({ format: "jwk" });

  const publicKeyEncodedPem = Buffer.from(pemPublicKey).toString("base64");
  return {
    keySet,
    publicKeyEncodedPem,
    publicKeyJwk,
  };
}

export async function signJWT({
  jwt: { headers, payload },
  keySet,
}: {
  jwt: {
    headers: JWTHeaderParameters;
    payload: JWTPayload;
  };
  keySet: ReturnType<typeof generateKeySet>["keySet"];
}): Promise<string> {
  const pemPrivateKey = keySet.privateKey.export({
    format: "pem",
    type: "pkcs8",
  });

  const privateKey = createPrivateKey(pemPrivateKey);
  return await new SignJWT(payload)
    .setProtectedHeader(headers)
    .sign(privateKey);
}
