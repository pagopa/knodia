import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type { EserviceVersionState } from "@knodia/eservice-models";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_CONFLICT, HTTP_STATUS_NOT_FOUND } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  ESERVICE_NOT_FOUND: "0001",
  ESERVICE_VERSION_NOT_FOUND: "0002",
  ESERVICE_VERSION_NOT_IN_EXPECTED_STATES: "0003",
  AGREEMENT_ALREADY_EXISTS: "0004",
  AGREEMENT_NOT_FOUND: "0005",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "agreement-process",
});

export function agreementAlreadyExists({
  consumerId,
  consumerKnodeId,
  eserviceId,
}: {
  consumerId: ExternalId<OrganizationId>;
  consumerKnodeId: KnodeId;
  eserviceId: EserviceId;
}) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_ALREADY_EXISTS",
    detail: `Agreement already exists for Consumer = ${consumerId}, Consumer Knode = ${consumerKnodeId}, E-service = ${eserviceId}`,
    status: HTTP_STATUS_CONFLICT,
    title: "Agreement already exists",
  });
}

export function agreementNotFound(id: AgreementId) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_NOT_FOUND",
    detail: `Agreement with id ${id} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Agreement Not Found",
  });
}

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
  versionId: EserviceVersionId,
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

export function eserviceVersionNotInExpectedStates(
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  allowedStates: EserviceVersionState[],
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_IN_EXPECTED_STATES",
    detail: `E-service version ${eserviceVersionId} of E-service ${eserviceId} is not in an allowed state: ${allowedStates}`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Version Not in Expected States",
  });
}
