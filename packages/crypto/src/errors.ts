import { genericInternalError } from "@knodia/common-models/errors";

export function invalidKeyLength(
  actualLength: number | undefined,
  minLength = 2048,
) {
  return genericInternalError(
    `Invalid RSA key length: ${actualLength} bits. It must be at least ${minLength}`,
  );
}

export function invalidPublicKey() {
  return genericInternalError("Public key is invalid");
}

export function notAllowedMultipleKeys() {
  return genericInternalError("The received key contains multiple keys");
}

export function notAllowedPrivateKey() {
  return genericInternalError("The received key is a private key");
}

export function notAnRSAKey() {
  return genericInternalError("Provided key is not an RSA key");
}
