import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  KeyId,
  PurposeId,
  UserId,
} from "@knodia/common-models/ids";
import type { ConsumerKeychainPurpose } from "@knodia/keychain-models";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NOT_FOUND,
} = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  CONSUMER_KEYCHAIN_NOT_FOUND: "0001",
  USER_ALREADY_MEMBER: "0002",
  USER_NOT_FOUND: "0003",
  INVALID_USER_ROLE: "0004",
  KEYCHAIN_MEMBER_NOT_FOUND: "0005",
  PURPOSE_ALREADY_LINKED_TO_CONSUMER_KEYCHAIN: "0006",
  INVALID_KEY_LENGTH: "0007",
  INVALID_PUBLIC_KEY: "0008",
  JWK_DECODING_ERROR: "0009",
  NOT_ALLOWED_CERTIFICATE: "0010",
  NOT_ALLOWED_MULTIPLE_KEYS: "0011",
  NOT_ALLOWED_PRIVATE_KEY: "0012",
  NOT_AN_RSA_KEY: "0013",
  KEY_ALREADY_EXISTS: "0014",
  TOO_MANY_KEYS_PER_KEYCHAIN: "0015",
  USER_NOT_ALLOWED: "0016",
  KEY_NOT_FOUND_IN_KEYCHAIN: "0017",
  CONSUMER_KEYCHAIN_PURPOSE_NOT_FOUND: "0018",
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

export function consumerKeychainPurposeNotFound({
  consumerKeychainId,
  purpose,
}: Omit<ConsumerKeychainPurpose, "linkedAt">) {
  return createApiError<ErrorCodes>({
    code: "CONSUMER_KEYCHAIN_PURPOSE_NOT_FOUND",
    detail: `Purpose with id ${purpose.id} owned by Knode ${purpose.knodeId} is not linked to Consumer Keychain with id ${consumerKeychainId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Consumer Keychain Purpose Not Found",
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

export function keyNotFoundInKeychain(
  kid: KeyId,
  keychainId: ConsumerKeychainId,
) {
  return createApiError<ErrorCodes>({
    code: "KEY_NOT_FOUND_IN_KEYCHAIN",
    detail: `Key with kid ${kid} not found in keychain ${keychainId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Key Not Found in Keychain",
  });
}

export function notAllowedCertificate() {
  return createApiError<ErrorCodes>({
    code: "NOT_ALLOWED_CERTIFICATE",
    detail: "The received key is a x509 certificate",
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

export function purposeAlreadyLinkedToConsumerKeychain(
  consumerKeychainId: ConsumerKeychainId,
  purpose: ExternalResource<PurposeId>,
) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_ALREADY_LINKED_TO_CONSUMER_KEYCHAIN",
    detail: `Purpose with id ${purpose.id} owned by Knode ${purpose.knodeId} is already linked to Consumer Keychain with id ${consumerKeychainId}`,
    status: HTTP_STATUS_CONFLICT,
    title: "Purpose Already Linked To Consumer Keychain",
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
    status: HTTP_STATUS_FORBIDDEN,
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
