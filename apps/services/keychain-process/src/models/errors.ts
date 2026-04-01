import type { ConsumerKeychainId, UserId } from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNAUTHORIZED,
} = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  CONSUMER_KEYCHAIN_NOT_FOUND: "0001",
  USER_ALREADY_MEMBER: "0002",
  USER_NOT_FOUND: "0003",
  INVALID_USER_ROLE: "0004",
  KEYCHAIN_MEMBER_NOT_FOUND: "0005",
  INVALID_KEY_LENGTH: "0006",
  INVALID_PUBLIC_KEY: "0007",
  JWK_DECODING_ERROR: "0008",
  NOT_ALLOWED_CERTIFICATE: "0009",
  NOT_ALLOWED_MULTIPLE_KEYS: "0010",
  NOT_ALLOWED_PRIVATE_KEY: "0011",
  NOT_AN_RSA_KEY: "0012",
  KEY_ALREADY_EXISTS: "0013",
  TOO_MANY_KEYS_PER_KEYCHAIN: "0014",
  USER_NOT_ALLOWED: "0015",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "keychain-process",
});

export function consumerKeychainNotFound(id: ConsumerKeychainId) {
  return createApiError<ErrorCodes>({
    code: "CONSUMER_KEYCHAIN_NOT_FOUND",
    detail: `Consumer keychain with id ${id} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Consumer Keychain Not Found",
  });
}

export function invalidKeyLength(
  actualLength: number | undefined,
  minLength = 2048,
) {
  return createApiError<ErrorCodes>({
    code: "INVALID_KEY_LENGTH",
    detail: `Invalid RSA key length: ${actualLength} bits. It must be at least ${minLength}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid Key length",
  });
}

export function invalidPublicKey() {
  return createApiError<ErrorCodes>({
    code: "INVALID_PUBLIC_KEY",
    detail: "Public key is invalid",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid Key",
  });
}

export function invalidUserRole(userId: UserId, requiredRole: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_USER_ROLE",
    detail: `User ${userId} does not have the required role: ${requiredRole}`,
    status: HTTP_STATUS_CONFLICT,
    title: "Invalid User Role",
  });
}

export function jwkDecodingError(error: unknown) {
  const detail =
    error instanceof Error
      ? `Unexpected error on JWK base64 decoding: ${error.message}`
      : `Unexpected error on JWK base64 decoding: ${JSON.stringify(error)}`;

  return createApiError<ErrorCodes>({
    code: "JWK_DECODING_ERROR",
    detail,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "JWK decoding error",
  });
}

export function keyAlreadyExists(kid: string) {
  return createApiError<ErrorCodes>({
    code: "KEY_ALREADY_EXISTS",
    detail: `Key with kid ${kid} already exists`,
    status: HTTP_STATUS_CONFLICT,
    title: "Key already exists",
  });
}

export function keychainMemberNotFound(
  consumerKeychainId: ConsumerKeychainId,
  userId: UserId,
) {
  return createApiError<ErrorCodes>({
    code: "KEYCHAIN_MEMBER_NOT_FOUND",
    detail: `User ${userId} is not a member of consumer keychain ${consumerKeychainId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Keychain Member Not Found",
  });
}

export function notAllowedCertificate() {
  return createApiError<ErrorCodes>({
    code: "NOT_ALLOWED_CERTIFICATE",
    detail: "The received key is a certificate",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Not allowed certificate",
  });
}

export function notAllowedMultipleKeys() {
  return createApiError<ErrorCodes>({
    code: "NOT_ALLOWED_MULTIPLE_KEYS",
    detail: "The received key contains multiple keys",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Not allowed multiple keys",
  });
}

export function notAllowedPrivateKey() {
  return createApiError<ErrorCodes>({
    code: "NOT_ALLOWED_PRIVATE_KEY",
    detail: "The received key is a private key",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Not allowed private key",
  });
}

export function notAnRSAKey() {
  return createApiError<ErrorCodes>({
    code: "NOT_AN_RSA_KEY",
    detail: "Provided key is not an RSA key",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Not an RSA key",
  });
}

export function tooManyKeysPerKeychain(
  keychainId: ConsumerKeychainId,
  size: number,
) {
  return createApiError<ErrorCodes>({
    code: "TOO_MANY_KEYS_PER_KEYCHAIN",
    detail: `Keys count (${size}) for the keychain ${keychainId} exceeds maximum allowed value`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Too many Keys per keychain",
  });
}

export function userAlreadyMember(
  consumerKeychainId: ConsumerKeychainId,
  userId: UserId,
) {
  return createApiError<ErrorCodes>({
    code: "USER_ALREADY_MEMBER",
    detail: `User ${userId} is already a member of consumer keychain ${consumerKeychainId}`,
    status: HTTP_STATUS_CONFLICT,
    title: "User Already Member",
  });
}

export function userNotAllowed(userId: UserId, keychainId: ConsumerKeychainId) {
  return createApiError<ErrorCodes>({
    code: "USER_NOT_ALLOWED",
    detail: `User ${userId} is not allowed to perform this action on keychain ${keychainId}`,
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "User Not Allowed",
  });
}

export function userNotFound(userId: UserId) {
  return createApiError<ErrorCodes>({
    code: "USER_NOT_FOUND",
    detail: `User ${userId} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "User Not Found",
  });
}
