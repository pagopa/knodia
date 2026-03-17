import type { AgreementState } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { EserviceVersionState } from "@knodia/eservice-models";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_CONFLICT, HTTP_STATUS_NOT_FOUND } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  PURPOSE_NOT_FOUND: "0001",
  ESERVICE_VERSION_NOT_IN_EXPECTED_STATE: "0002",
  AGREEMENT_NOT_IN_EXPECTED_STATE: "0003",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "purpose-process",
});

export function agreementNotInExpectedState({
  allowedStates,
  consumerId,
  consumerKnodeId,
  eserviceId,
}: {
  allowedStates: AgreementState[];
  consumerId: ExternalId<OrganizationId>;
  consumerKnodeId: KnodeId;
  eserviceId: EserviceId;
}) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_NOT_IN_EXPECTED_STATE",
    detail: `No agreement in state [${allowedStates.join(", ")}] found for Consumer = ${consumerId}, Consumer Knode = ${consumerKnodeId}, E-service = ${eserviceId}`,
    status: HTTP_STATUS_CONFLICT,
    title: "Agreement Not in Expected State",
  });
}

export function eserviceVersionNotInExpectedState(
  eserviceId: EserviceId,
  allowedStates: EserviceVersionState[],
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_IN_EXPECTED_STATE",
    detail: `E-service ${eserviceId} has no version in state [${allowedStates.join(", ")}]`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Version Not in Expected State",
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
