import type { Algorithm } from "@knodia/common-models/algorithms";

import {
  type CommonErrorCodes,
  createApiError,
  createApiErrorFromErrorsList,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";
import { ZodError } from "zod";

import { EXPECTED_GRANT_TYPE } from "./constants.ts";

const { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_INTERNAL_SERVER_ERROR } =
  constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR: "0001",
  UNEXPECTED_CLIENT_ASSERTION_SIGNATURE_VERIFICATION_ERROR: "0002",
  CLIENT_ASSERTION_EXPIRED: "0003",
  INVALID_CLIENT_ASSERTION_SIGNATURE: "0004",
  JSON_WEB_TOKEN_ERROR: "0005",
  PUBLIC_KEY_ALG_NOT_MATCHING_CLIENT_ASSERTION_ALG: "0006",
  UNSUPPORTED_GRANT_TYPE: "0007",
  INVALID_REQUEST_PARAMETERS: "0008",
};
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = CommonErrorCodes | keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "authorization-server",
});

export function clientAssertionClaimsValidationError(error: unknown) {
  return createApiErrorFromErrorsList<ErrorCodes>({
    code: "CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR",
    errors:
      error instanceof ZodError
        ? error.issues
        : error instanceof Error
          ? [error]
          : [],
    status: HTTP_STATUS_BAD_REQUEST,
    title: "invalid_client",
  });
}

export function clientAssertionExpired() {
  return createApiError<ErrorCodes>({
    code: "CLIENT_ASSERTION_EXPIRED",
    detail: "The Client Assertion has expired",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "invalid_client",
  });
}

export function invalidClientAssertionSignature() {
  return createApiError<ErrorCodes>({
    code: "INVALID_CLIENT_ASSERTION_SIGNATURE",
    detail: "The Client Assertion signature is invalid",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "invalid_client",
  });
}

export function invalidRequestParameters(error: ZodError) {
  return createApiErrorFromErrorsList<ErrorCodes>({
    code: "INVALID_REQUEST_PARAMETERS",
    errors: error.issues,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "invalid_request",
  });
}

export function jsonWebTokenError(message: string) {
  return createApiError<ErrorCodes>({
    code: "JSON_WEB_TOKEN_ERROR",
    detail: `Invalid JWT format in Client Assertion signature verification. Reason: ${message}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "invalid_client",
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
    title: "invalid_client",
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

export function unsupportedGrantType(grantType: string) {
  return createApiError<ErrorCodes>({
    code: "UNSUPPORTED_GRANT_TYPE",
    detail: `The grant type '${grantType}' is not supported. Only '${EXPECTED_GRANT_TYPE}' is supported.`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "unsupported_grant_type",
  });
}
