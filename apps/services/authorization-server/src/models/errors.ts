import type { AgreementState } from "@knodia/agreement-models";
import type {
  ExternalId,
  ExternalResource,
} from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { EserviceVersionState } from "@knodia/eservice-models";
import type { PurposeState } from "@knodia/purpose-models";
import type { ZodError } from "zod";

import {
  type ApiError,
  type CommonErrorCodes,
  createApiError,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";
import { fromZodError } from "zod-validation-error";

const { HTTP_STATUS_BAD_REQUEST } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR: "0001",
  JTI_NOT_FOUND: "0002",
  IAT_NOT_FOUND: "0003",
  EXP_NOT_FOUND: "0004",
  ISS_NOT_FOUND: "0005",
  SUB_NOT_FOUND: "0006",
  INVALID_SUB_FORMAT: "0007",
  INVALID_SUB: "0008",
  INVALID_PURPOSE_ID_FORMAT: "0009",
  KID_NOT_FOUND: "0010",
  INVALID_KID_FORMAT: "0011",
  AUD_NOT_FOUND: "0012",
  ALG_NOT_FOUND: "0013",
  ALG_NOT_SUPPORTED: "0014",
  INVALID_ISS_FORMAT: "0015",
  INVALID_ISS: "0016",
  CLIENT_ASSERTION_INVALID_CLAIMS: "0017",
  INVALID_CLIENT_ASSERTION_FORMAT: "0018",
  TYP_NOT_FOUND: "0019",
  TYP_NOT_SUPPORTED: "0020",
  PURPOSE_ID_NOT_FOUND: "0021",
  UNEXPECTED_CLIENT_ASSERTION_SIGNATURE_VERIFICATION_ERROR: "0022",
  CLIENT_ASSERTION_EXPIRED: "0023",
  INVALID_CLIENT_ASSERTION_SIGNATURE: "0024",
  JSON_WEB_TOKEN_ERROR: "0025",
  AGREEMENT_NOT_ACTIVE: "0026",
  ESERVICE_VERSION_NOT_ACTIVE: "0027",
  PURPOSE_NOT_ACTIVE: "0028",
  INVALID_AUDIENCE: "0029",
  CONSUMER_MISSING_REQUIRED_ATTRIBUTES: "0030",
  AGREEMENT_NOT_FOUND: "0031",
  ESERVICE_VERSION_NOT_FOUND: "0032",
  PURPOSE_NOT_FOUND: "0033",
};
/* eslint-enable perfectionist/sort-objects */

export type ErrorCodes = CommonErrorCodes | keyof typeof errorCodes;

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
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Agreement not found",
  });
}

export function algNotFound() {
  return createApiError<ErrorCodes>({
    code: "ALG_NOT_FOUND",
    detail:
      "The 'alg' header is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'alg' header",
  });
}

export function algNotSupported(alg: string) {
  return createApiError<ErrorCodes>({
    code: "ALG_NOT_SUPPORTED",
    detail: `The 'alg' header value '${alg}' is not supported. Only 'RS256' is supported.`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Unsupported 'alg' header value",
  });
}

export function audNotFound() {
  return createApiError<ErrorCodes>({
    code: "AUD_NOT_FOUND",
    detail:
      "The 'aud' claim is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'aud' claim",
  });
}

export function clientAssertionClaimsValidationError(
  consumerKeychainId: string,
  validationErrors: ApiError<ErrorCodes>[],
) {
  const errorDetails = `${validationErrors.map((e) => e.errors.map((err) => err.detail).join("; ")).join("; ")}`;

  return createApiError<ErrorCodes>({
    code: "CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR",
    detail: `Client Assertion claims validation failed for Consumer Keychain ${consumerKeychainId}. Reasons: ${errorDetails}`,
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

export function clientAssertionInvalidClaims(
  error: ZodError,
  headerOrPayload: "header" | "payload",
) {
  return createApiError<ErrorCodes>({
    code: "CLIENT_ASSERTION_INVALID_CLAIMS",
    detail: `Invalid claims in Client Assertion ${headerOrPayload}. Error: ${fromZodError(error)}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: `Invalid claims in Client Assertion ${headerOrPayload}`,
  });
}

export function consumerMissingRequiredAttributes(
  consumerId: ExternalId<OrganizationId>,
  eserviceVersionId: EserviceVersionId,
) {
  return createApiError<ErrorCodes>({
    code: "CONSUMER_MISSING_REQUIRED_ATTRIBUTES",
    detail: `Consumer ${consumerId} missing required attributes for the requested E-service version ${eserviceVersionId}`,
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
    status: HTTP_STATUS_BAD_REQUEST,
    title: "E-service Version not found",
  });
}

export function expNotFound() {
  return createApiError<ErrorCodes>({
    code: "EXP_NOT_FOUND",
    detail:
      "The 'exp' claim is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'exp' claim",
  });
}

export function iatNotFound() {
  return createApiError<ErrorCodes>({
    code: "IAT_NOT_FOUND",
    detail:
      "The 'iat' claim is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'iat' claim",
  });
}

export function invalidAudience(
  clientAssertionAud: string | string[],
  eserviceVersionAudiences: string[],
) {
  return createApiError<ErrorCodes>({
    code: "INVALID_AUDIENCE",
    detail: `Invalid audience in Client Assertion. Received: ${JSON.stringify(clientAssertionAud)}, Expected: ${JSON.stringify(eserviceVersionAudiences)}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid audience in Client Assertion",
  });
}

export function invalidClientAssertionFormat(message: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_CLIENT_ASSERTION_FORMAT",
    detail: `Invalid format for Client Assertion: ${message}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid format for Client Assertion",
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

export function invalidIss(iss: string, consumerKeychainId: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_ISS",
    detail: `The 'iss' claim value '${iss}' does not match the expected Consumer Keychain '${consumerKeychainId}'`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid 'iss' claim value",
  });
}

export function invalidIssFormat(iss: unknown) {
  return createApiError<ErrorCodes>({
    code: "INVALID_ISS_FORMAT",
    detail: `The 'iss' claim has an invalid format. Received value: ${iss}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid 'iss' claim format",
  });
}

export function invalidKidFormat(kid: unknown) {
  return createApiError<ErrorCodes>({
    code: "INVALID_KID_FORMAT",
    detail: `The 'kid' header has an invalid format. Received value: ${kid}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid 'kid' header format",
  });
}

export function invalidPurposeIdFormat(purposeId: unknown) {
  return createApiError<ErrorCodes>({
    code: "INVALID_PURPOSE_ID_FORMAT",
    detail: `The 'purpose_id' claim has an invalid format. Received value: ${purposeId}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid 'purpose_id' claim format",
  });
}

export function invalidSub(sub: string, consumerKeychainId: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_SUB",
    detail: `The 'sub' claim value '${sub}' does not match the expected Consumer Keychain '${consumerKeychainId}'`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid 'sub' claim value",
  });
}

export function invalidSubFormat(sub: unknown) {
  return createApiError<ErrorCodes>({
    code: "INVALID_SUB_FORMAT",
    detail: `The 'sub' claim has an invalid format. Received value: ${sub}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid 'sub' claim format",
  });
}

export function issNotFound() {
  return createApiError<ErrorCodes>({
    code: "ISS_NOT_FOUND",
    detail:
      "The 'iss' claim is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'iss' claim",
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

export function jtiNotFound() {
  return createApiError<ErrorCodes>({
    code: "JTI_NOT_FOUND",
    detail:
      "The 'jti' claim is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'jti' claim",
  });
}

export function kidNotFound() {
  return createApiError<ErrorCodes>({
    code: "KID_NOT_FOUND",
    detail:
      "The 'kid' header is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'kid' header",
  });
}

export function purposeIdNotFound() {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_ID_NOT_FOUND",
    detail:
      "The 'purpose_id' claim is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'purpose_id' claim",
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
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Purpose not found",
  });
}

export function subNotFound() {
  return createApiError<ErrorCodes>({
    code: "SUB_NOT_FOUND",
    detail:
      "The 'sub' claim is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'sub' claim",
  });
}

export function typNotFound() {
  return createApiError<ErrorCodes>({
    code: "TYP_NOT_FOUND",
    detail:
      "The 'typ' header is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'typ' header",
  });
}

export function typNotSupported(typ: string) {
  return createApiError<ErrorCodes>({
    code: "TYP_NOT_SUPPORTED",
    detail: `The 'typ' header value '${typ}' is not supported. Only 'JWT' is supported.`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Unsupported 'typ' header value",
  });
}

export function unexpectedClientAssertionSignatureVerificationError(
  message: string,
) {
  return createApiError<ErrorCodes>({
    code: "UNEXPECTED_CLIENT_ASSERTION_SIGNATURE_VERIFICATION_ERROR",
    detail: `An unexpected error occurred during Client Assertion verification: ${message}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Unexpected error during Client Assertion verification",
  });
}
