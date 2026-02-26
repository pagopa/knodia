import type { EserviceId, EserviceVersionId } from "@knodia/common-models/ids";
import type { EserviceVersionState } from "@knodia/eservice-models";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_NOT_FOUND } = constants;

const errorCodes = {
  ESERVICE_NOT_FOUND: "0001",
  ESERVICE_VERSION_NOT_FOUND: "0002",
  ESERVICE_VERSION_NOT_IN_EXPECTED_STATE: "0003",
} as const;

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes);

// TODO: copied from eservice-process, consider centralizing
export function eserviceNotFound(id: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_NOT_FOUND",
    detail: `E-service with id ${id} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Not Found",
  });
}

export function eserviceVersionNotFound(
  eserviceId: EserviceId,
  versionId?: EserviceVersionId,
) {
  const detail = versionId
    ? `E-service version '${versionId}' not found for e-service '${eserviceId}'`
    : `No versions found for e-service '${eserviceId}'`;

  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_FOUND",
    detail,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Version Not Found",
  });
}

export function eserviceVersionNotInExpectedState(
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  allowedStates: EserviceVersionState[],
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_IN_EXPECTED_STATE",
    detail: `E-service version ${eserviceVersionId} of E-service ${eserviceId} is not in an allowed state: ${allowedStates}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "E-service Version Not in Expected State",
  });
}
