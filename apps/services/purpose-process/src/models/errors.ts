import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_CONFLICT, HTTP_STATUS_NOT_FOUND } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  PURPOSE_NOT_FOUND: "0001",
  ESERVICE_NOT_ACTIVE: "0002",
  ACTIVE_AGREEMENT_NOT_FOUND: "0003",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "purpose-process",
});

export function activeAgreementNotFound({
  consumerId,
  consumerKnodeId,
  eserviceId,
}: {
  consumerId: ExternalId<OrganizationId>;
  consumerKnodeId: KnodeId;
  eserviceId: EserviceId;
}) {
  return createApiError<ErrorCodes>({
    code: "ACTIVE_AGREEMENT_NOT_FOUND",
    detail: `No active agreement found for Consumer = ${consumerId}, Consumer Knode = ${consumerKnodeId}, E-service = ${eserviceId}`,
    status: HTTP_STATUS_CONFLICT,
    title: "Active Agreement Not Found",
  });
}

export function eserviceNotActive(id: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_NOT_ACTIVE",
    detail: `E-service ${id} has no active version`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Not Active",
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
