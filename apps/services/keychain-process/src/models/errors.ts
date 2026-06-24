import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  EserviceId,
  KeyId,
  KnodeApiKeychainId,
  ProducerKeychainId,
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
  JWK_DECODING_ERROR: "0007",
  NOT_ALLOWED_CERTIFICATE: "0008",
  KEY_ALREADY_EXISTS: "0009",
  TOO_MANY_KEYS_PER_KEYCHAIN: "0010",
  USER_NOT_ALLOWED: "0011",
  KEY_NOT_FOUND_IN_KEYCHAIN: "0012",
  CONSUMER_KEYCHAIN_PURPOSE_NOT_FOUND: "0013",
  KNODE_API_KEYCHAIN_NOT_FOUND: "0014",
  PRODUCER_KEYCHAIN_NOT_FOUND: "0015",
  ESERVICE_ALREADY_LINKED_TO_PRODUCER_KEYCHAIN: "0016",
  PRODUCER_KEYCHAIN_ESERVICE_NOT_FOUND: "0017",
  ESERVICE_NOT_FOUND: "0018",
  PRODUCER_KEY_NOT_FOUND: "0019",
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

export function eserviceAlreadyLinkedToProducerKeychain(
  producerKeychainId: ProducerKeychainId,
  eserviceId: EserviceId,
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_ALREADY_LINKED_TO_PRODUCER_KEYCHAIN",
    detail: `E-service with id ${eserviceId} is already linked to Producer Keychain with id ${producerKeychainId}`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Already Linked To Producer Keychain",
  });
}

export function eserviceNotFound(eserviceId: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_NOT_FOUND",
    detail: `E-service with id ${eserviceId} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Not Found",
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

export function jwkDecodingError(details: string) {
  return createApiError<ErrorCodes>({
    code: "JWK_DECODING_ERROR",
    detail: details,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "JWK Decoding Error",
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
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId,
  userId: UserId,
) {
  return createApiError<ErrorCodes>({
    code: "KEYCHAIN_MEMBER_NOT_FOUND",
    detail: `User ${userId} is not currently an active member of keychain ${keychainId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Keychain Member Not Found",
  });
}

export function keyNotFoundInKeychain(
  kid: KeyId,
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId,
) {
  return createApiError<ErrorCodes>({
    code: "KEY_NOT_FOUND_IN_KEYCHAIN",
    detail: `Key with kid ${kid} not found in keychain ${keychainId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Key Not Found in Keychain",
  });
}

export function knodeApiKeychainNotFound(id: KnodeApiKeychainId) {
  return createApiError<ErrorCodes>({
    code: "KNODE_API_KEYCHAIN_NOT_FOUND",
    detail: `Knode API keychain with id ${id} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Knode API Keychain Not Found",
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

export function producerKeychainEserviceNotFound(
  producerKeychainId: ProducerKeychainId,
  eserviceId: EserviceId,
) {
  return createApiError<ErrorCodes>({
    code: "PRODUCER_KEYCHAIN_ESERVICE_NOT_FOUND",
    detail: `E-service with id ${eserviceId} is not linked to Producer Keychain with id ${producerKeychainId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Producer Keychain E-service Not Found",
  });
}

export function producerKeychainNotFound(id: ProducerKeychainId) {
  return createApiError<ErrorCodes>({
    code: "PRODUCER_KEYCHAIN_NOT_FOUND",
    detail: `Producer keychain with id ${id} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Producer Keychain Not Found",
  });
}

export function producerKeyNotFound(kid: KeyId) {
  return createApiError<ErrorCodes>({
    code: "PRODUCER_KEY_NOT_FOUND",
    detail: `Producer key with kid ${kid} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Producer Key Not Found",
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
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId,
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
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId,
  userId: UserId,
) {
  return createApiError<ErrorCodes>({
    code: "USER_ALREADY_MEMBER",
    detail: `User ${userId} is already a member of keychain ${keychainId}`,
    status: HTTP_STATUS_CONFLICT,
    title: "User Already Member",
  });
}

export function userNotAllowed(
  userId: UserId,
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId,
) {
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
