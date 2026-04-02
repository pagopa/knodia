import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  PurposeId,
  UserId,
} from "@knodia/common-models/ids";
import type { ConsumerKeychainPurpose } from "@knodia/keychain-models";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_CONFLICT, HTTP_STATUS_NOT_FOUND } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  CONSUMER_KEYCHAIN_NOT_FOUND: "0001",
  USER_ALREADY_MEMBER: "0002",
  USER_NOT_FOUND: "0003",
  INVALID_USER_ROLE: "0004",
  KEYCHAIN_MEMBER_NOT_FOUND: "0005",
  PURPOSE_ALREADY_LINKED_TO_CONSUMER_KEYCHAIN: "0006",
  CONSUMER_KEYCHAIN_PURPOSE_NOT_FOUND: "0007",
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

export function invalidUserRole(userId: UserId, requiredRole: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_USER_ROLE",
    detail: `User ${userId} does not have the required role: ${requiredRole}`,
    status: HTTP_STATUS_CONFLICT,
    title: "Invalid User Role",
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

export function userNotFound(userId: UserId) {
  return createApiError<ErrorCodes>({
    code: "USER_NOT_FOUND",
    detail: `User ${userId} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "User Not Found",
  });
}
