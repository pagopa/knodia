import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";

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
  ESERVICE_NOT_FOUND_FOR_PRODUCER: "0001",
  ESERVICE_NOT_ACTIVE: "0002",
  ESERVICE_SIGNAL_HUB_NOT_ENABLED: "0003",
  SIGNAL_ALREADY_EXISTS: "0004",
  NON_CONSECUTIVE_SIGNAL_ID: "0005",
  CONSUMER_NOT_AUTHORIZED_TO_PULL_SIGNALS: "0006",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "signal-hub",
});

export function consumerNotAuthorizedToPullSignals(
  eserviceId: EserviceId,
  { id: organizationId, knodeId }: ExternalResource<OrganizationId>,
) {
  return createApiError<ErrorCodes>({
    code: "CONSUMER_NOT_AUTHORIZED_TO_PULL_SIGNALS",
    detail: `No active Agreement and Purpose found for E-service ${eserviceId} and Consumer ${organizationId} (Knode ${knodeId})`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Consumer Not Authorized To Pull Signals",
  });
}

export function eserviceNotActive(eserviceId: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_NOT_ACTIVE",
    detail: `E-service with id ${eserviceId} is not active`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Not Active",
  });
}

export function eserviceNotFoundForProducer(
  eserviceId: EserviceId,
  producerId: OrganizationId,
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_NOT_FOUND_FOR_PRODUCER",
    detail: `E-service with id ${eserviceId} not found for producer ${producerId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Not Found For Producer",
  });
}

export function eserviceSignalHubNotEnabled(eserviceId: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_SIGNAL_HUB_NOT_ENABLED",
    detail: `E-service with id ${eserviceId} does not have signal hub enabled`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Signal Hub Not Enabled",
  });
}

export function nonConsecutiveSignalId(
  signalId: number,
  maxSignalId: number,
  eserviceId: EserviceId,
) {
  return createApiError<ErrorCodes>({
    code: "NON_CONSECUTIVE_SIGNAL_ID",
    detail:
      maxSignalId === 0
        ? `No signals pushed yet for E-service ${eserviceId}, expected 1 as first Signal id`
        : `Signal id ${signalId} is not consecutive to the last pushed signal id ${maxSignalId} for E-service ${eserviceId}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Non Consecutive Signal Id",
  });
}

export function signalAlreadyExists(signalId: number, eserviceId: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "SIGNAL_ALREADY_EXISTS",
    detail: `Signal with id ${signalId} already exists for E-service ${eserviceId}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Signal Already Exists",
  });
}
