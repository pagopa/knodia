import type { ExternalId } from "@knodia/common-models/externalResource";
import type { ConsumerKeychainId, PurposeId } from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_CONFLICT, HTTP_STATUS_NOT_FOUND } = constants;

const errorCodes = {
  CONSUMER_KEYCHAIN_NOT_FOUND: "0001",
  PURPOSE_ALREADY_LINKED_TO_CONSUMER_KEYCHAIN: "0002",
} as const;

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

export function purposeAlreadyLinkedToConsumerKeychain(
  consumerKeychainId: ConsumerKeychainId,
  purposeId: ExternalId<PurposeId>,
) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_ALREADY_LINKED_TO_CONSUMER_KEYCHAIN",
    detail: `Purpose with id ${purposeId} is already linked to Consumer Keychain with id ${consumerKeychainId}`,
    status: HTTP_STATUS_CONFLICT,
    title: "Purpose Already Linked To Consumer Keychain",
  });
}
