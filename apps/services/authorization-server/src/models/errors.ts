import type { AgreementState } from "@knodia/agreement-models";
import type { Algorithm } from "@knodia/common-models/crypto";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { PurposeState } from "@knodia/purpose-models";
import type { AxiosError } from "axios";

import { type DpopErrorKey } from "@knodia/dpop-validator";
import {
  EserviceAccessTokenType,
  type EserviceVersion,
  type EserviceVersionState,
} from "@knodia/eservice-models";
import {
  type ApiError,
  type CommonErrorCodes,
  createApiError,
  createApiErrorFromErrorsList,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";
import { ZodError } from "zod";

const {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_UNAUTHORIZED,
} = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR: "0001",
  UNEXPECTED_CLIENT_ASSERTION_SIGNATURE_VERIFICATION_ERROR: "0002",
  CLIENT_ASSERTION_EXPIRED: "0003",
  INVALID_CLIENT_ASSERTION_SIGNATURE: "0004",
  INVALID_CLIENT_ASSERTION_JWS: "0005",
  PUBLIC_KEY_ALG_NOT_MATCHING_CLIENT_ASSERTION_ALG: "0006",
  AGREEMENT_NOT_ACTIVE: "0007",
  ESERVICE_VERSION_NOT_ACTIVE: "0008",
  PURPOSE_NOT_ACTIVE: "0009",
  CONSUMER_MISSING_REQUIRED_ATTRIBUTES: "0010",
  AGREEMENT_NOT_FOUND: "0011",
  ESERVICE_VERSION_NOT_FOUND: "0012",
  PURPOSE_NOT_FOUND: "0013",
  PLATFORM_STATES_NOT_ACTIVE: "0014",
  ACCESS_TOKEN_TYPE_MISMATCH: "0015",
  CONSUMER_KNODE_VERIFICATION_DATA_NOT_FOUND: "0016",
  UNEXPECTED_CONSUMER_KNODE_VERIFICATION_DATA_RETRIEVAL_ERROR: "0017",
  DPOP_CLAIMS_VALIDATION_ERROR: "0018",
  UNEXPECTED_DPOP_PROOF_SIGNATURE_VERIFICATION_ERROR: "0019",
  INVALID_DPOP_PROOF_JWS: "0020",
  INVALID_DPOP_PROOF_SIGNATURE: "0021",
  DPOP_PROOF_EXPIRED: "0022",
} satisfies Record<DpopErrorKey, string> & Record<string, string>;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = CommonErrorCodes | keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "authorization-server",
});

export function accessTokenTypeMismatch(
  { accessTokenType, id }: Pick<EserviceVersion, "accessTokenType" | "id">,
  isRequestUsingDpop: boolean,
) {
  return createApiError<ErrorCodes>({
    code: "ACCESS_TOKEN_TYPE_MISMATCH",
    detail: `E-service Version with ID ${id} requires ${accessTokenType} tokens, but the request is asking for a ${isRequestUsingDpop ? EserviceAccessTokenType.enum.DPoP : EserviceAccessTokenType.enum.Bearer} token`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "unauthorized_client",
  });
}

export function agreementNotActive(id: AgreementId, state: AgreementState) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_NOT_ACTIVE",
    detail: `Agreement with ID ${id} is in state '${state}', but it must be in 'Active' state`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "unauthorized_client",
  });
}

export function agreementNotFound(
  consumer: ExternalResource<OrganizationId>,
  eserviceId: EserviceId,
) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_NOT_FOUND",
    detail: `Agreement for Consumer ${consumer.id} (${consumer.knodeId}) and E-service ${eserviceId} was not found`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "unauthorized_client",
  });
}

export function clientAssertionClaimsValidationError(error: unknown) {
  return createApiErrorFromErrorsList<ErrorCodes>({
    code: "CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR",
    errors:
      error instanceof ZodError
        ? error.issues
        : error instanceof Error
          ? [error]
          : [],
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_client",
  });
}

export function clientAssertionExpired() {
  return createApiError<ErrorCodes>({
    code: "CLIENT_ASSERTION_EXPIRED",
    detail: "The Client Assertion has expired",
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_client",
  });
}

export function consumerKnodeVerificationDataNotFound() {
  return createApiError<ErrorCodes>({
    code: "CONSUMER_KNODE_VERIFICATION_DATA_NOT_FOUND",
    detail: "Verification data for the Consumer's Knode was not found",
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_client",
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
    title: "unauthorized_client",
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
    title: "unauthorized_client",
  });
}

export function eserviceVersionNotFound(
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_FOUND",
    detail: `E-service Version with ID ${eserviceVersionId} for E-service ${eserviceId} was not found`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "unauthorized_client",
  });
}

export function invalidClientAssertionJWS(message: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_CLIENT_ASSERTION_JWS",
    detail: `Invalid JWT format in Client Assertion signature verification. Reason: ${message}`,
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_client",
  });
}

export function invalidClientAssertionSignature() {
  return createApiError<ErrorCodes>({
    code: "INVALID_CLIENT_ASSERTION_SIGNATURE",
    detail: "The Client Assertion signature is invalid",
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_client",
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
    title: "unauthorized_client",
  });
}

export function publicKeyAlgNotMatchingClientAssertionAlg(
  publicKeyAlg: string,
  clientAssertionAlg: Algorithm,
) {
  return createApiError<ErrorCodes>({
    code: "PUBLIC_KEY_ALG_NOT_MATCHING_CLIENT_ASSERTION_ALG",
    detail: `The Public Key algorithm (${publicKeyAlg}) does not match the Client Assertion algorithm (${clientAssertionAlg})`,
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_client",
  });
}

export function purposeNotActive(id: PurposeId, state: PurposeState) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_ACTIVE",
    detail: `Purpose with ID ${id} is in state '${state}', but it must be in 'Active' state`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "unauthorized_client",
  });
}

export function purposeNotFound(id: PurposeId) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_FOUND",
    detail: `Purpose with ID ${id} was not found`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "unauthorized_client",
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
    title: "invalid_client",
  });
}

export function unexpectedConsumerKnodeVerificationDataRetrievalError(
  error: AxiosError,
) {
  return createApiError<ErrorCodes>({
    code: "UNEXPECTED_CONSUMER_KNODE_VERIFICATION_DATA_RETRIEVAL_ERROR",
    detail: `An unexpected error occurred during retrieval of the Consumer's Knode verification data: ${error.message}`,
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "invalid_client",
  });
}
