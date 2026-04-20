import type { AgreementState } from "@knodia/agreement-models";
import type { Algorithm } from "@knodia/common-models/algorithms";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { EserviceVersionState } from "@knodia/eservice-models";
import type { PurposeState } from "@knodia/purpose-models";

import {
  type ApiError,
  type CommonErrorCodes,
  createApiError,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

const {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR: "0001",
  UNEXPECTED_CLIENT_ASSERTION_SIGNATURE_VERIFICATION_ERROR: "0002",
  CLIENT_ASSERTION_EXPIRED: "0003",
  INVALID_CLIENT_ASSERTION_SIGNATURE: "0004",
  JSON_WEB_TOKEN_ERROR: "0005",
  PUBLIC_KEY_ALG_NOT_MATCHING_CLIENT_ASSERTION_ALG: "0006",
  AGREEMENT_NOT_ACTIVE: "0007",
  ESERVICE_VERSION_NOT_ACTIVE: "0008",
  PURPOSE_NOT_ACTIVE: "0009",
  CONSUMER_MISSING_REQUIRED_ATTRIBUTES: "0010",
  AGREEMENT_NOT_FOUND: "0011",
  ESERVICE_VERSION_NOT_FOUND: "0012",
  PURPOSE_NOT_FOUND: "0013",
  PLATFORM_STATES_NOT_ACTIVE: "0014",
};
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = CommonErrorCodes | keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "authorization-server",
});

export function agreementNotActive(id: AgreementId, state: AgreementState) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_NOT_ACTIVE",
    detail: `Agreement with ID ${id} is in state '${state}', but it must be in 'Active' state`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Agreement state is not Active",
  });
}

export function agreementNotFound(
  consumer: ExternalResource<OrganizationId>,
  eserviceId: EserviceId,
) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_NOT_FOUND",
    detail: `Agreement for Consumer ${consumer.id} (${consumer.knodeId}) and E-service ${eserviceId} was not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Agreement not found",
  });
}

export function clientAssertionClaimsValidationError(
  consumerKeychainId: string,
  error: unknown,
) {
  const message =
    error instanceof ZodError
      ? fromZodError(error).message
      : error instanceof Error
        ? error.message
        : "Unknown error";

  return createApiError<ErrorCodes>({
    code: "CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR",
    detail: `Client Assertion claims validation failed for Consumer Keychain ${consumerKeychainId}. Reasons: ${message}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Client Assertion claims validation error",
  });
}

export function clientAssertionExpired() {
  return createApiError<ErrorCodes>({
    code: "CLIENT_ASSERTION_EXPIRED",
    detail: "The Client Assertion has expired",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Client Assertion expired",
  });
}

export function consumerMissingRequiredAttributes(
  consumer: ExternalResource<OrganizationId>,
  eserviceVersionId: EserviceVersionId,
) {
  return createApiError<ErrorCodes>({
    code: "CONSUMER_MISSING_REQUIRED_ATTRIBUTES",
    detail: `Consumer ${consumer.id} (Knode ${consumer.knodeId}) missing required attributes for the requested E-service version ${eserviceVersionId}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Consumer Missing Required Attributes",
  });
}

export function eserviceVersionNotActive(
  id: EserviceVersionId,
  state: EserviceVersionState,
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_ACTIVE",
    detail: `E-service Version with ID ${id} is in state '${state}', but it must be in 'Active' state`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "E-service Version state is not Active",
  });
}

export function eserviceVersionNotFound(
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_FOUND",
    detail: `E-service Version with ID ${eserviceVersionId} for E-service ${eserviceId} was not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Version not found",
  });
}

export function invalidClientAssertionSignature() {
  return createApiError<ErrorCodes>({
    code: "INVALID_CLIENT_ASSERTION_SIGNATURE",
    detail: "The Client Assertion signature is invalid",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid Client Assertion signature",
  });
}

export function jsonWebTokenError(message: string) {
  return createApiError<ErrorCodes>({
    code: "JSON_WEB_TOKEN_ERROR",
    detail: `Invalid JWT format in Client Assertion signature verification. Reason: ${message}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "JSON Web Token error",
  });
}
export function platformStatesNotActive(
  errors: (ApiError<ErrorCodes> | undefined)[],
) {
  const cleanedErrors = errors.filter(
    (e): e is ApiError<ErrorCodes> => e !== undefined,
  );
  const errorDetails = `${cleanedErrors.map((e) => e.errors.map((err) => err.detail).join("; ")).join("; ")}`;

  return createApiError<ErrorCodes>({
    code: "PLATFORM_STATES_NOT_ACTIVE",
    detail: `One or more platform objects are not in 'Active' state. Details: ${errorDetails}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Platform states not Active",
  });
}

export function publicKeyAlgNotMatchingClientAssertionAlg(
  publicKeyAlg: string,
  clientAssertionAlg: Algorithm,
) {
  return createApiError<ErrorCodes>({
    code: "PUBLIC_KEY_ALG_NOT_MATCHING_CLIENT_ASSERTION_ALG",
    detail: `The Public Key algorithm (${publicKeyAlg}) does not match the Client Assertion algorithm (${clientAssertionAlg})`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Public Key algorithm does not match Client Assertion algorithm",
  });
}

export function purposeNotActive(id: PurposeId, state: PurposeState) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_ACTIVE",
    detail: `Purpose with ID ${id} is in state '${state}', but it must be in 'Active' state`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Purpose state is not Active",
  });
}

export function purposeNotFound(id: PurposeId) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_FOUND",
    detail: `Purpose with ID ${id} was not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Purpose not found",
  });
}

export function unexpectedClientAssertionSignatureVerificationError(
  error: unknown,
) {
  const message = error instanceof Error ? error.message : "Unknown error";

  return createApiError<ErrorCodes>({
    code: "UNEXPECTED_CLIENT_ASSERTION_SIGNATURE_VERIFICATION_ERROR",
    detail: `An unexpected error occurred during Client Assertion signature verification: ${message}`,
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "Unexpected error during Client Assertion signature verification",
  });
}
