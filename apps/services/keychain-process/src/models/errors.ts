import type { ConsumerKeychainId, PurposeId } from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_NOT_FOUND } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  CONSUMER_KEYCHAIN_NOT_FOUND: "0001",
  PURPOSE_NOT_FOUND: "0002",
  CONSUMER_KEYCHAIN_PURPOSE_NOT_FOUND: "0003",
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

export function consumerKeychainPurposeNotFound(
  consumerKeychainId: ConsumerKeychainId,
  purposeId: PurposeId,
) {
  return createApiError<ErrorCodes>({
    code: "CONSUMER_KEYCHAIN_PURPOSE_NOT_FOUND",
    detail: `Purpose ${purposeId} not linked to Consumer Keychain ${consumerKeychainId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Consumer Keychain Purpose Not Found",
  });
}

export function purposeNotFound(id: PurposeId) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_FOUND",
    detail: `Purpose with id ${id} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Purpose Not Found",
  });
}
