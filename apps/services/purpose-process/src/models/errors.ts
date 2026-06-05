import type { AgreementState } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
  PurposeFormOptionId,
  PurposeId,
} from "@knodia/common-models/ids";
import type {
  EserviceMode,
  EserviceVersionState,
} from "@knodia/eservice-models";
import type { PurposeActor, PurposeState } from "@knodia/purpose-models";
import type { ErrorObject } from "ajv";

import {
  createApiError,
  createApiErrorFromErrorsList,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  PURPOSE_NOT_FOUND: "0001",
  ESERVICE_VERSION_NOT_IN_EXPECTED_STATES: "0002",
  AGREEMENT_NOT_IN_EXPECTED_STATES: "0003",
  ESERVICE_MODE_NOT_ALLOWED: "0004",
  ESERVICE_NOT_FOUND: "0005",
  AGREEMENT_NOT_FOUND: "0006",
  FORM_ANSWERS_VALIDATION_FAILED: "0007",
  PURPOSE_NOT_IN_SUSPENDABLE_STATE: "0008",
  PURPOSE_NOT_IN_REACTIVATABLE_STATE: "0009",
  ORGANIZATION_NOT_PURPOSE_PRODUCER: "0010",
  PURPOSE_NOT_IN_EXPECTED_STATES: "0011",
  PURPOSE_FORM_OPTION_NOT_FOUND: "0012",
  RECEIVE_DATA_CONFIG_MISSING: "0013",
  DAILY_CALLS_EXCEED_LIMIT: "0014",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "purpose-process",
});

export function agreementNotFound({
  consumerId,
  consumerKnodeId,
  eserviceId,
}: {
  consumerId: ExternalId<OrganizationId>;
  consumerKnodeId: KnodeId;
  eserviceId: EserviceId;
}) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_NOT_FOUND",
    detail: `No agreement found for Consumer = ${consumerId}, Consumer Knode = ${consumerKnodeId}, E-service = ${eserviceId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Agreement Not Found",
  });
}

export function agreementNotInExpectedStates({
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
    code: "AGREEMENT_NOT_IN_EXPECTED_STATES",
    detail: `No agreement in state [${allowedStates.join(", ")}] found for Consumer = ${consumerId}, Consumer Knode = ${consumerKnodeId}, E-service = ${eserviceId}`,
    status: HTTP_STATUS_CONFLICT,
    title: "Agreement Not in Expected States",
  });
}

export function dailyCallsExceedLimit(
  eserviceId: EserviceId,
  dailyCalls: number,
  maxDailyCallsPerConsumer: number,
) {
  return createApiError<ErrorCodes>({
    code: "DAILY_CALLS_EXCEED_LIMIT",
    detail: `dailyCalls ${dailyCalls} exceeds the per-consumer limit of ${maxDailyCallsPerConsumer} for E-service ${eserviceId}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Daily Calls Exceed Limit",
  });
}

export function eserviceModeNotAllowed(
  eserviceId: EserviceId,
  actualMode: EserviceMode,
  expectedMode: EserviceMode,
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_MODE_NOT_ALLOWED",
    detail: `E-service ${eserviceId} has mode ${actualMode}, expected ${expectedMode}`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Mode Not Allowed",
  });
}

export function eserviceNotFound(eserviceId: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_NOT_FOUND",
    detail: `E-service ${eserviceId} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Not Found",
  });
}

export function eserviceVersionNotInExpectedStates(
  eserviceId: EserviceId,
  allowedStates: EserviceVersionState[],
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_IN_EXPECTED_STATES",
    detail: `E-service ${eserviceId} has no version in state [${allowedStates.join(", ")}]`,
    status: HTTP_STATUS_CONFLICT,
    title: "E-service Version Not in Expected States",
  });
}

export function formAnswersValidationFailed(errors: ErrorObject[]) {
  return createApiErrorFromErrorsList<ErrorCodes>({
    code: "FORM_ANSWERS_VALIDATION_FAILED",
    errors: errors.map(
      (e) =>
        new Error(
          `${e.instancePath || "/"} ${e.message ?? "validation failed"}`,
        ),
    ),
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Form Answers Validation Failed",
  });
}

export function organizationNotPurposeProducer(
  purposeId: PurposeId,
  organizationId: OrganizationId,
) {
  return createApiError<ErrorCodes>({
    code: "ORGANIZATION_NOT_PURPOSE_PRODUCER",
    detail: `Organization ${organizationId} is not the producer of Purpose ${purposeId}`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Organization Not Purpose Producer",
  });
}

export function purposeFormOptionNotFound(
  eserviceId: EserviceId,
  purposeFormOptionId: PurposeFormOptionId,
) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_FORM_OPTION_NOT_FOUND",
    detail: `PurposeFormOption ${purposeFormOptionId} not found on E-service ${eserviceId}`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "PurposeFormOption Not Found",
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

export function purposeNotInExpectedStates({
  allowedStates,
  purposeId,
  state,
}: {
  allowedStates: PurposeState[];
  purposeId: PurposeId;
  state: PurposeState;
}) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_IN_EXPECTED_STATES",
    detail: `Purpose ${purposeId} is in state ${state}, expected one of [${allowedStates.join(", ")}]`,
    status: HTTP_STATUS_CONFLICT,
    title: "Purpose Not in Expected States",
  });
}

export function purposeNotInReactivatableState({
  purposeId,
  reactivatedBy,
  state,
  suspendedByConsumerAt,
  suspendedByProducerAt,
}: {
  purposeId: PurposeId;
  reactivatedBy: PurposeActor;
  state: PurposeState;
  suspendedByConsumerAt: Date | null;
  suspendedByProducerAt: Date | null;
}) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_IN_REACTIVATABLE_STATE",
    detail: `Purpose ${purposeId} cannot be reactivated by ${reactivatedBy} (state=${state}, suspendedByConsumerAt=${suspendedByConsumerAt?.toISOString() ?? "null"}, suspendedByProducerAt=${suspendedByProducerAt?.toISOString() ?? "null"})`,
    status: HTTP_STATUS_CONFLICT,
    title: "Purpose Not In Reactivatable State",
  });
}

export function purposeNotInSuspendableState({
  purposeId,
  state,
  suspendedBy,
  suspendedByConsumerAt,
  suspendedByProducerAt,
}: {
  purposeId: PurposeId;
  state: PurposeState;
  suspendedBy: PurposeActor;
  suspendedByConsumerAt: Date | null;
  suspendedByProducerAt: Date | null;
}) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_IN_SUSPENDABLE_STATE",
    detail: `Purpose ${purposeId} cannot be suspended by ${suspendedBy} (state=${state}, suspendedByConsumerAt=${suspendedByConsumerAt?.toISOString() ?? "null"}, suspendedByProducerAt=${suspendedByProducerAt?.toISOString() ?? "null"})`,
    status: HTTP_STATUS_CONFLICT,
    title: "Purpose Not In Suspendable State",
  });
}

export function receiveDataConfigMissing(eserviceId: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "RECEIVE_DATA_CONFIG_MISSING",
    detail: `E-service ${eserviceId} is in ReceiveData mode but has no receiveDataConfig (data-integrity anomaly)`,
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "Receive Data Config Missing",
  });
}
