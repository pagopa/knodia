import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_CONFLICT, HTTP_STATUS_FORBIDDEN, HTTP_STATUS_NOT_FOUND } =
  constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  ESERVICE_NOT_FOUND_FOR_PRODUCER: "0001",
  ESERVICE_NOT_ACTIVE: "0002",
  ESERVICE_SIGNAL_HUB_NOT_ENABLED: "0003",
  SIGNAL_ALREADY_EXISTS: "0004",
  SIGNALS_WITH_HIGHER_ID_EXIST: "0005",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "signal-hub",
});

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
    status: HTTP_STATUS_FORBIDDEN,
    title: "E-service Signal Hub Not Enabled",
  });
}

export function signalAlreadyExists(signalId: number, eserviceId: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "SIGNAL_ALREADY_EXISTS",
    detail: `Signal with id ${signalId} already exists for E-service ${eserviceId}`,
    status: HTTP_STATUS_CONFLICT,
    title: "Signal Already Exists",
  });
}

export function signalsWithHigherIdExist(
  signalId: number,
  eserviceId: EserviceId,
  timeWindowInSeconds: number,
) {
  return createApiError<ErrorCodes>({
    code: "SIGNALS_WITH_HIGHER_ID_EXIST",
    detail: `Signals with id greater than ${signalId} have been pushed for E-service ${eserviceId} in the last ${timeWindowInSeconds} seconds`,
    status: HTTP_STATUS_CONFLICT,
    title: "Signals With Higher Id Exist",
  });
}
