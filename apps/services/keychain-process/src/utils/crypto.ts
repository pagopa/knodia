import crypto, { KeyObject } from "crypto";

import {
  invalidKeyLength,
  invalidPublicKey,
  jwkDecodingError,
  notAllowedCertificate,
  notAllowedMultipleKeys,
  notAllowedPrivateKey,
  notAnRSAKey,
} from "../models/errors.ts";

const decodeBase64ToPem = (base64String: string): string => {
  try {
    const cleanedBase64 = base64String.trim();
    const decodedBytes = Buffer.from(cleanedBase64, "base64");
    return decodedBytes.toString("utf-8");
  } catch (error) {
    throw jwkDecodingError(error);
  }
};

export const createJWK = ({
  pemKeyBase64,
}: {
  pemKeyBase64: string;
}): JsonWebKey =>
  createPublicKey({ key: pemKeyBase64 }).export({ format: "jwk" });

export const calculateKid = (jwk: JsonWebKey): string => {
  const sortedJwk = sortJWK(jwk);
  const jwkString = JSON.stringify(sortedJwk);
  return crypto.createHash("sha256").update(jwkString).digest("base64url");
};

function assertNotCertificate(key: string): void {
  try {
    new crypto.X509Certificate(key);
  } catch {
    return;
  }
  throw notAllowedCertificate();
}

function assertNotPrivateKey(key: string): void {
  try {
    crypto.createPrivateKey(key);
  } catch {
    return;
  }
  throw notAllowedPrivateKey();
}

function assertSingleKey(keyString: string): void {
  const beginMatches = keyString.match(/-----BEGIN [^\r\n]+-----/g);

  if (beginMatches && beginMatches.length > 1) {
    throw notAllowedMultipleKeys();
  }
}

function assertValidRSAKey(key: KeyObject): void {
  if (key.asymmetricKeyType !== "rsa") {
    throw notAnRSAKey();
  }
}

function assertValidRSAKeyLength(key: KeyObject, minLength = 2048): void {
  const length = key.asymmetricKeyDetails?.modulusLength;
  if (!length || length < minLength) {
    throw invalidKeyLength(length, minLength);
  }
}

function createPublicKey({ key }: { key: string }): KeyObject {
  const pemKey = decodeBase64ToPem(key);
  assertSingleKey(pemKey);

  assertNotPrivateKey(pemKey);
  assertNotCertificate(pemKey);
  const publicKey = tryToCreatePublicKey(pemKey);

  assertValidRSAKey(publicKey);
  assertValidRSAKeyLength(publicKey);

  return publicKey;
}

function sortJWK(jwk: JsonWebKey): JsonWebKey {
  return [...Object.keys(jwk)].sort().reduce<JsonWebKey>(
    (prev, sortedKey) => ({
      ...prev,
      [sortedKey]: jwk[sortedKey as keyof typeof jwk],
    }),
    {},
  );
}

function tryToCreatePublicKey(key: string): KeyObject {
  try {
    return crypto.createPublicKey(key);
  } catch {
    throw invalidPublicKey();
  }
}
