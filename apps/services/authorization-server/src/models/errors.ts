import {
  type ApiError,
  type CommonErrorCodes,
  createApiError,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

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
};
/* eslint-enable perfectionist/sort-objects */

export type ErrorCodes = CommonErrorCodes | keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "authorization-server",
});

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
  return createApiError<ErrorCodes>({
    code: "CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR",
    detail: `Client Assertion claims validation failed for Consumer Keychain ${consumerKeychainId}. Reasons: ${validationErrors.map((e) => `${e.message}`).join("; ")}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Client Assertion claims validation error",
  });
}

export function clientAssertionInvalidClaims(
  error: string,
  headerOrPayload: "header" | "payload",
) {
  return createApiError<ErrorCodes>({
    code: "CLIENT_ASSERTION_INVALID_CLAIMS",
    detail: `Invalid claims in Client Assertion ${headerOrPayload}. Error: ${error}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: `Invalid claims in Client Assertion ${headerOrPayload}`,
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

export function invalidClientAssertionFormat(message: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_CLIENT_ASSERTION_FORMAT",
    detail: `Invalid format for Client Assertion: ${message}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid format for Client Assertion",
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

export function subNotFound() {
  return createApiError<ErrorCodes>({
    code: "SUB_NOT_FOUND",
    detail:
      "The 'sub' claim is required but was not found in the Client Assertion",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Missing 'sub' claim",
  });
}
